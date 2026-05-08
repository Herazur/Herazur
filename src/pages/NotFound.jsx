import React from 'react';
import Seo from '@/components/Seo';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <Seo
        title="Page Not Found"
        description="The page you are looking for could not be found."
        noindex
      />
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        We could not find the page you are looking for.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild>
          <Link to="/">Go Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/discover">Discover</Link>
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
