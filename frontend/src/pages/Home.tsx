export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome to <span className="text-primary-600">LMS System</span>
        </h1>
        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive Learning Management System designed for programming education and
          certification training. Enhance your skills with gamification and structured learning
          paths.
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <button className="btn-primary">Get Started</button>
          <button className="btn-outline">Browse Courses</button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Interactive Learning</h3>
          <p className="text-gray-600">
            Engage with diverse learning materials including videos, PDFs, and interactive
            programming exercises.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
          <p className="text-gray-600">
            Monitor your learning journey with visual progress indicators and achievement badges.
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Q&A Community</h3>
          <p className="text-gray-600">
            Connect with peers and instructors through our comprehensive Q&A and knowledge base
            system.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Learning Statistics</h2>
        <div className="grid md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600">500+</div>
            <div className="text-gray-600">Active Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600">50+</div>
            <div className="text-gray-600">Courses</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600">1000+</div>
            <div className="text-gray-600">Learning Materials</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600">99.5%</div>
            <div className="text-gray-600">Uptime</div>
          </div>
        </div>
      </section>
    </div>
  );
}