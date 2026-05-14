"use client";

type Props = {
  imageUrl: string;
  imageFit: string;
  imageZoom: number;
  imageX: number;
  imageY: number;
  onImageFitChange: (value: string) => void;
  onImageZoomChange: (value: number) => void;
  onImageXChange: (value: number) => void;
  onImageYChange: (value: number) => void;
};

export default function ImageAdjustControls({
  imageUrl,
  imageFit,
  imageZoom,
  imageX,
  imageY,
  onImageFitChange,
  onImageZoomChange,
  onImageXChange,
  onImageYChange,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <h3 className="text-lg font-semibold">Ajuste visual de imagen</h3>

      <p className="mt-2 text-sm text-white/45">
        Ajusta cómo se verá la imagen en la tienda sin modificar el archivo original.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950">
        {imageUrl ? (
          <div className="flex h-72 items-center justify-center overflow-hidden bg-black">
            <img
              src={imageUrl}
              alt="Vista previa"
              className="h-full w-full"
              style={{
                objectFit: imageFit as "cover" | "contain",
                objectPosition: `${imageX}% ${imageY}%`,
                transform: `scale(${imageZoom})`,
              }}
            />
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center text-sm text-white/35">
            Agrega una URL de imagen para ver la vista previa.
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="text-sm text-white/45">Modo de imagen</span>

          <select
            value={imageFit}
            onChange={(e) => onImageFitChange(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          >
            <option value="cover">Recortar y llenar</option>
            <option value="contain">Mostrar completa</option>
          </select>
        </label>

        <RangeControl
          label="Zoom"
          min={1}
          max={2}
          step={0.05}
          value={imageZoom}
          onChange={onImageZoomChange}
        />

        <RangeControl
          label="Mover horizontal"
          min={0}
          max={100}
          step={1}
          value={imageX}
          onChange={onImageXChange}
        />

        <RangeControl
          label="Mover vertical"
          min={0}
          max={100}
          step={1}
          value={imageY}
          onChange={onImageYChange}
        />
      </div>
    </div>
  );
}

function RangeControl({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/45">{label}</span>
        <span className="text-white/35">{value}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
    </label>
  );
}