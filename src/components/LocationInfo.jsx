import { MapPin, Clock } from "lucide-react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"

const LocationInfo = ({ location, onOpenMaps }) => {
  if (!location) return null

  return (
    <Card className="p-4 bg-card/50 border-border">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Ubicación Actual</h3>
      </div>

      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-1 gap-2">
          <div>
            <p className="text-muted-foreground">Coordenadas</p>
            <p className="font-mono">
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
          <div className="flex justify-between">
            <div>
              <p className="text-muted-foreground">Precisión</p>
              <p>{Math.round(location.accuracy)}m</p>
            </div>
            <div>
              <p className="text-muted-foreground">Velocidad</p>
              <p>{location.speed ? Math.round(location.speed * 3.6) : 0} km/h</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-muted-foreground">Última actualización</p>
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(location.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <Button
        onClick={onOpenMaps}
        variant="outline"
        className="w-full mt-3 text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground bg-transparent"
      >
        <MapPin className="w-3 h-3 mr-2" />
        Ver en Google Maps
      </Button>
    </Card>
  )
}

export { LocationInfo }
