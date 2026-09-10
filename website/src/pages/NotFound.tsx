import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-emerald-700">404</p>
      <h1 className="mt-2 text-3xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-2 text-stone-600">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
        Back to home
      </Link>
    </div>
  );
}
