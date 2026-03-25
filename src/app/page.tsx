import BgRemover from "@/components/BgRemover";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            <span className="text-violet-400">BG</span>Remover
          </h2>
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 tracking-tight">
          Image Background Remover
        </h1>
        <p className="text-gray-400 text-lg text-center mb-10 max-w-xl">
          Remove backgrounds from your photos instantly with AI. 100% automatic,
          no signup required. Get a transparent PNG in seconds.
        </p>
        <BgRemover />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            How to Remove Background from Image
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-3">📤</div>
              <h3 className="font-semibold mb-2">1. Upload Image</h3>
              <p className="text-gray-400 text-sm">
                Drag and drop or click to upload your photo. Supports PNG, JPG,
                and WebP formats.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">2. AI Processing</h3>
              <p className="text-gray-400 text-sm">
                Our AI automatically detects the subject and removes the
                background in seconds.
              </p>
            </div>
            <div>
              <div className="text-4xl mb-3">⬇️</div>
              <h3 className="font-semibold mb-2">3. Download Result</h3>
              <p className="text-gray-400 text-sm">
                Preview the result with the comparison slider and download your
                transparent PNG.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-t border-gray-800 py-16 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Perfect For
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "🛍️",
                title: "E-commerce Product Photos",
                desc: "Clean product images with transparent backgrounds for your online store.",
              },
              {
                icon: "📸",
                title: "Profile Pictures",
                desc: "Remove messy backgrounds from portraits and headshots.",
              },
              {
                icon: "🎨",
                title: "Graphic Design",
                desc: "Extract subjects for use in designs, presentations, and marketing materials.",
              },
              {
                icon: "📱",
                title: "Social Media Content",
                desc: "Create eye-catching posts with clean, professional-looking images.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 rounded-xl bg-gray-800/50"
              >
                <div className="text-3xl">{item.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-gray-800 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is this background remover free?",
                a: "Yes! You can remove backgrounds from your images completely free. No signup or credit card required.",
              },
              {
                q: "What image formats are supported?",
                a: "We support PNG, JPG, JPEG, and WebP formats. The maximum file size is 25MB.",
              },
              {
                q: "How does the AI background removal work?",
                a: "We use advanced AI models that detect the foreground subject in your image and precisely separate it from the background, producing a clean transparent PNG.",
              },
              {
                q: "Is my image data safe?",
                a: "Your images are processed in real-time and are not stored on our servers. Once processing is complete, the data is discarded.",
              },
              {
                q: "Can I use the results commercially?",
                a: "Absolutely. The processed images are yours to use for any purpose — personal or commercial.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} BGRemover — Free Online Image Background
          Remover Tool
        </p>
      </footer>
    </main>
  );
}
