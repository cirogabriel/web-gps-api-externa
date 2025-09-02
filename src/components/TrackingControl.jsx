import { Navigation } from "lucide-react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"

const TrackingControl = ({ isTracking, onStart, onStop }) => {
  return (
    <Card className="p-4 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? "bg-green-500" : "bg-muted"}`} />
          <span className="text-sm font-medium">{isTracking ? "Rastreando" : "Detenido"}</span>
        </div>
        <Badge
          variant={isTracking ? "default" : "secondary"}
          className="bg-accent text-accent-foreground text-xs"
        >
          {isTracking ? "ACTIVO" : "INACTIVO"}
        </Badge>
      </div>

      <Button
        onClick={isTracking ? onStop : onStart}
        className={`w-full text-sm ${isTracking ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"} text-accent-foreground`}
      >
        <Navigation className="w-4 h-4 mr-2" />
        {isTracking ? "Detener" : "Iniciar"}
      </Button>
    </Card>
  )
}

export { TrackingControl }
