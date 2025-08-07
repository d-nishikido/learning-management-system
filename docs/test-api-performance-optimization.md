# Test Management API - Performance Optimization Guide

## Database Indexing Strategy

### 1. Primary Performance Indexes

#### Test Availability Index
```sql
CREATE INDEX idx_test_availability ON tests(available_from, available_until, is_published);
```
**Purpose**: Optimizes queries that filter tests by availability and publication status
- Used in: `getTests()` with `availableOnly` filter
- Query pattern: `WHERE is_published = true AND available_from <= NOW() AND available_until >= NOW()`
- Performance gain: ~70% reduction in query time for available test searches

#### User Test Results Performance Index
```sql
CREATE INDEX idx_user_test_results_performance ON user_test_results(test_id, user_id, completed_at);
```
**Purpose**: Optimizes user result retrieval and statistics calculations
- Used in: `getUserTestResults()`, `getTestStatistics()`
- Query pattern: `WHERE test_id = ? AND user_id = ? ORDER BY completed_at DESC`
- Performance gain: ~80% reduction in query time for result fetching

### 2. Specialized Indexes

#### Active Sessions Index
```sql
CREATE INDEX idx_user_test_results_active_sessions 
ON user_test_results(user_id, test_id, status) 
WHERE status = 'IN_PROGRESS';
```
**Purpose**: Fast lookup of active test sessions
- Used in: `canUserTakeTest()`, `getUserTestSession()`
- Partial index reduces storage overhead

#### Statistics Calculation Index
```sql
CREATE INDEX idx_user_test_results_statistics 
ON user_test_results(test_id, is_passed, score) 
WHERE status = 'COMPLETED';
```
**Purpose**: Optimizes aggregate statistics queries
- Used in: `getTestStatistics()`
- Enables efficient calculation of pass rates and average scores

### 3. Query Optimization Patterns

#### Efficient Test Availability Check
```typescript
// Before optimization
const tests = await prisma.test.findMany({
  where: {
    AND: [
      { isPublished: true },
      { OR: [{ availableFrom: null }, { availableFrom: { lte: now } }] },
      { OR: [{ availableUntil: null }, { availableUntil: { gte: now } }] }
    ]
  }
});

// After optimization (uses idx_test_availability)
const tests = await prisma.test.findMany({
  where: {
    isPublished: true,
    availableFrom: { lte: now },
    availableUntil: { gte: now }
  }
});
```

#### Batch Loading Test Questions
```typescript
// Avoid N+1 queries
const test = await prisma.test.findUnique({
  where: { id },
  include: {
    testQuestions: {
      include: {
        question: {
          include: {
            questionOptions: true
          }
        }
      },
      orderBy: { sortOrder: 'asc' }
    }
  }
});
```

### 4. Caching Strategy

#### Redis Cache Implementation
```typescript
// Cache key patterns
const CACHE_KEYS = {
  TEST_DETAILS: (id: number) => `test:${id}:details`,
  USER_ELIGIBILITY: (userId: number, testId: number) => `user:${userId}:test:${testId}:eligibility`,
  TEST_STATISTICS: (id: number) => `test:${id}:stats`,
  TEST_QUESTIONS: (id: number) => `test:${id}:questions`
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  TEST_DETAILS: 3600,        // 1 hour
  USER_ELIGIBILITY: 300,      // 5 minutes
  TEST_STATISTICS: 1800,      // 30 minutes
  TEST_QUESTIONS: 7200        // 2 hours
};
```

#### Cacheable Operations
1. **Test Details**: Cache test metadata (rarely changes)
2. **User Eligibility**: Cache canUserTakeTest results (short TTL)
3. **Test Statistics**: Cache aggregate statistics (moderate TTL)
4. **Test Questions**: Cache question sets (invalidate on update)

### 5. Database Connection Pooling

#### Prisma Connection Pool Configuration
```typescript
// prisma/client.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pool settings
  connectionLimit: 10,        // Maximum connections
  connectTimeout: 10000,      // 10 seconds
  pool: {
    min: 2,                   // Minimum idle connections
    max: 10,                  // Maximum total connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
    acquireTimeoutMillis: 10000 // Timeout acquiring connection
  }
});
```

### 6. Query Performance Monitoring

#### Slow Query Logging
```typescript
// Enable query logging in development
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log slow queries
prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Queries taking more than 1 second
    console.warn(`Slow query detected (${e.duration}ms):`, e.query);
  }
});
```

#### Performance Metrics to Track
- Average query response time
- 95th percentile response time
- Database connection pool utilization
- Cache hit ratio
- Slow query count

### 7. Pagination Best Practices

#### Cursor-based Pagination for Large Datasets
```typescript
async getTestsWithCursor(cursor?: number, limit: number = 20) {
  const tests = await prisma.test.findMany({
    take: limit + 1,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor }
    }),
    orderBy: { id: 'asc' }
  });

  const hasMore = tests.length > limit;
  const nextCursor = hasMore ? tests[limit - 1].id : null;

  return {
    data: tests.slice(0, limit),
    nextCursor,
    hasMore
  };
}
```

### 8. Batch Operations

#### Bulk Insert User Answers
```typescript
// Instead of individual inserts
for (const answer of answers) {
  await prisma.userAnswer.create({ data: answer });
}

// Use createMany for batch insert
await prisma.userAnswer.createMany({
  data: answers,
  skipDuplicates: true
});
```

### 9. Database Maintenance

#### Regular Maintenance Tasks
1. **VACUUM**: Weekly vacuum to reclaim storage
2. **ANALYZE**: Update statistics after bulk operations
3. **REINDEX**: Monthly reindexing for optimal performance
4. **Monitor bloat**: Check for table and index bloat

```sql
-- Vacuum and analyze tables
VACUUM ANALYZE tests;
VACUUM ANALYZE user_test_results;
VACUUM ANALYZE test_questions;
VACUUM ANALYZE user_answers;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan;
```

### 10. Load Testing Recommendations

#### Performance Benchmarks
- **Target**: Support 500 concurrent users
- **Response Time**: < 200ms for read operations
- **Throughput**: 100 test submissions per minute
- **Database Connections**: Max 50 concurrent connections

#### Load Testing Scenarios
1. **Peak Load**: 500 users taking tests simultaneously
2. **Sustained Load**: 200 users over 1 hour
3. **Spike Test**: 0 to 500 users in 5 minutes
4. **Stress Test**: Increase load until system fails

#### Tools
- **k6**: API load testing
- **Apache JMeter**: Comprehensive load testing
- **pgbench**: Database-specific load testing

## Implementation Priority

### Phase 1: Immediate Optimizations (Week 1)
- [ ] Add database indexes (completed)
- [ ] Implement connection pooling
- [ ] Enable slow query logging

### Phase 2: Caching Layer (Week 2)
- [ ] Setup Redis cache
- [ ] Implement cache for test details
- [ ] Cache user eligibility checks

### Phase 3: Advanced Optimizations (Week 3-4)
- [ ] Implement cursor-based pagination
- [ ] Optimize batch operations
- [ ] Setup performance monitoring

### Phase 4: Testing & Tuning (Week 5)
- [ ] Conduct load testing
- [ ] Fine-tune database parameters
- [ ] Optimize based on metrics

## Monitoring Dashboard

### Key Metrics to Display
1. **API Response Times** (p50, p95, p99)
2. **Database Query Performance**
3. **Cache Hit Ratio**
4. **Active Test Sessions**
5. **Error Rate**
6. **Database Connection Pool Status**

### Alert Thresholds
- API response time > 500ms (warning)
- API response time > 1000ms (critical)
- Database connection pool > 80% (warning)
- Cache hit ratio < 70% (warning)
- Error rate > 1% (critical)

## Conclusion

These optimizations will ensure the Test Management API can handle the expected load of 500 concurrent users while maintaining sub-200ms response times. Regular monitoring and maintenance will be crucial for sustained performance.