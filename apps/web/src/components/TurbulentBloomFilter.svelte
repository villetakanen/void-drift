<script lang="ts">
import {
  TURBULENT_BLOOM_DEFAULTS,
  type TurbulentBloomSettings,
} from "./turbulent-bloom";

let {
  filterId,
  glowSize = TURBULENT_BLOOM_DEFAULTS.glowSize,
  distortion = TURBULENT_BLOOM_DEFAULTS.distortion,
  strength = TURBULENT_BLOOM_DEFAULTS.strength,
}: { filterId: string } & Partial<TurbulentBloomSettings> = $props();
</script>

<filter
  id={filterId}
  x="-12%"
  y="-12%"
  width="124%"
  height="124%"
  color-interpolation-filters="sRGB"
>
  <feTurbulence
    type="fractalNoise"
    baseFrequency="0.008"
    numOctaves="2"
    seed="7"
    result="bloom-noise"
  />
  <feDisplacementMap
    in="SourceGraphic"
    in2="bloom-noise"
    scale={distortion}
    xChannelSelector="R"
    yChannelSelector="G"
    result="bloom-distorted"
  />
  <feGaussianBlur
    in="bloom-distorted"
    stdDeviation={glowSize}
    result="bloom-blurred"
  />
  <feColorMatrix
    in="bloom-blurred"
    type="matrix"
    values={`${strength / 100} 0 0 0 0 0 ${strength / 100} 0 0 0 0 0 ${strength / 100} 0 0 0 0 0 1 0`}
    result="bloom-attenuated"
  />
  <feBlend in="SourceGraphic" in2="bloom-attenuated" mode="screen" />
</filter>
