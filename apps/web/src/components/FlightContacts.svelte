<script lang="ts">
import type {
  FlightContactCue,
  FlightContactKind,
} from "../lib/flight-contacts";

let {
  contacts,
  width,
  height,
}: { contacts: readonly FlightContactCue[]; width: number; height: number } =
  $props();
const colors: Record<FlightContactKind, string> = {
  pirate: "var(--color-red)",
  sun: "var(--color-android-green)",
  wreck: "var(--color-caution-tape)",
  cell: "var(--color-android-green)",
};
const skullId = $props.id();

// Keep the SVG bounds local to the visible arc.
function contactArcPath(contact: FlightContactCue): string {
  const radius = contact.radius - 16;
  const angle = (contact.angle * Math.PI) / 180;
  const halfSweep = contact.arcLength / (2 * radius);
  const startAngle = angle - halfSweep;
  const endAngle = angle + halfSweep;
  const startX = contact.centerX + radius * Math.cos(startAngle);
  const startY = contact.centerY + radius * Math.sin(startAngle);
  const endX = contact.centerX + radius * Math.cos(endAngle);
  const endY = contact.centerY + radius * Math.sin(endAngle);
  const largeArc = halfSweep > Math.PI / 2 ? 1 : 0;
  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
}
</script>

{#if contacts.length}
  <svg
    class="contact-overlay"
    {width}
    {height}
    viewBox={`0 0 ${width} ${height}`}
  >
    <title>Flight contacts</title>
    <defs>
      <symbol id={skullId} viewBox="61.38 146.48 77.55 98.92">
        <path
          d="m 79.000295,219.12511 1.551499,17.83343 c 0,0 4.081795,2.16668 4.174736,1.33334 0.09294,-0.83333 0.929393,-17.33343 0.929393,-17.33343 l 4.554025,0.33333 0.900924,17.0001 4.582494,7.09585 1.115271,-23.42928 h 2.509362 v -7.46256 l -11.80329,-3.70417 h -11.80329 z"
        />
        <path
          d="m 119.6357,219.12511 -2.08066,17.83343 c 0,0 -3.55263,3.22502 -3.64557,2.39168 -0.0929,-0.83334 -0.9294,-18.39177 -0.9294,-18.39177 l -4.55402,0.33334 -0.90093,17.0001 -4.58249,2.33335 -1.11527,-18.66678 h -2.509361 v -7.46257 l 11.803291,-3.70417 h 11.80329 z"
        />
        <path
          d="m 75.169407,211.02305 -13.786078,-5.59117 4.827384,-12.20929 4.792427,0.22821 1.562526,8.16215 12.938114,3.70482 7.416856,-10.3836 -4.520018,-9.96212 -16.484634,-2.80123 -0.79874,6.02189 -3.765478,-0.68464 -2.282111,-15.06192 6.545519,-9.13443 5.743067,3.78503 -4.389594,6.62562 3.223567,1.71727 3.887957,-6.47687 6.665063,4.36883 1.719429,-3.64007 -6.372804,-4.077 4.266261,-6.29764 -3.514191,-1.54321 -3.694901,5.76158 -4.91295,-3.31844 5.106006,-7.69492 18.93226,-5.94274 0.728835,48.58323 -9.638154,17.46631 -5.116402,-1.60565 z"
        />
        <path
          d="m 122.96496,211.02009 15.95992,-5.60147 -4.83628,-12.23178 -6.75389,0.22862 -2.21629,8.82807 -10.35844,3.06077 -7.43053,-10.40273 4.52835,-12.58399 14.56238,-0.20288 0.80021,6.03298 5.72505,-0.6859 2.28632,-15.08967 -12.99698,-19.96097 -20.91978,-5.30281 -0.0793,48.02187 9.65592,17.4985 5.12583,-1.60861 z"
        />
        <path d="m 96.808637,214.49589 2.509362,-7.46256 2.509361,7.46256 z" />
      </symbol>
    </defs>
    {#each contacts as contact (`${contact.kind}:${contact.id}`)}
      {@const color = colors[contact.kind]}
      <g data-contact-kind={contact.kind}>
        <title>{contact.name}</title>
        <g
          transform={`translate(${contact.x} ${contact.y}) rotate(${contact.angle + 90})`}
          fill={color}
          stroke={color}
        >
          <path d="M 0 -8 L 6 8 L -6 8 Z" stroke="none" />
          {#if contact.kind === "pirate"}
            <use
              href={`#${skullId}`}
              x="-12"
              y="24"
              width="24"
              height="24"
              opacity=".33"
              stroke="none"
            />
          {:else if contact.kind === "sun"}
            <g
              transform={`translate(0 29) rotate(${-contact.angle - 90})`}
              opacity=".5"
              fill="none"
              stroke-width="1.2"
            >
              <circle r="6" />
            </g>
          {:else}
            <g
              transform={`translate(0 29) rotate(${30 - contact.angle - 90})`}
              opacity=".5"
              fill="none"
              stroke-width="1.2"
            >
              <rect x="-6" y="-6" width="12" height="12" />
            </g>
          {/if}
        </g>
        <path
          d={contactArcPath(contact)}
          fill="none"
          stroke={color}
          stroke-width="2"
        />
      </g>
    {/each}
  </svg>
{/if}

<style>
.contact-overlay {
  position: absolute;
  inset: 0;
  z-index: 4;
  overflow: visible;
  pointer-events: none;
  /* Paint moving contact cues in a separate layer above the filtered field. */
  will-change: transform;
}
</style>
