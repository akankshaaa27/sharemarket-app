import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-semibold mb-2">404 - Not Found</h2>
      <p className="text-muted-foreground mb-4">
        The page you are looking for does not exist.
      </p>
      <Link to="/" className="text-primary hover:underline">
        Go back home
      </Link>
    </div>
  );
}
