import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="text-8xl">🐿️</div>
      <div>
        <h1 className="text-3xl font-bold text-foreground">404 - Page Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          This squirrel couldn't find what you're looking for!
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button variant="ghost" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  )
}
