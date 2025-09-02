import { MapPin } from "lucide-react"

const MapComponent = ({ location, className = "" }) => {
  return (
    <div className={`flex-1 relative bg-muted ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="p-6 rounded-full bg-card/80 backdrop-blur-sm border border-border mb-4">
            <MapPin className="w-12 h-12 text-accent mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Mapa Interactivo</h3>
          <p className="text-muted-foreground max-w-sm">
            {location
              ? "Tu ubicación se mostrará aquí en tiempo real"
              : "Inicia el seguimiento para ver tu ubicación en el mapa"}
          </p>
          {location && (
            <div className="mt-4 p-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border inline-block">
              <p className="text-sm font-mono">
                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { MapComponent }
