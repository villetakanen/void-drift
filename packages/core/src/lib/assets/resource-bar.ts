export interface ResourceBarProps {
    value: number;        // 0-100
    maxValue: number;     // Usually 100
    label: string;        // "HULL" or "POWER"
    colorNormal: string;  // CSS color for 50-100%
    colorWarning: string; // CSS color for 25-49%
    colorDanger: string;  // CSS color for 0-24%
}

/**
 * Draw a resource bar on canvas
 * For use in gallery/workbench only (Svelte version for game HUD)
 */
export function drawResourceBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    props: ResourceBarProps
): void {
    const percentage = (props.value / props.maxValue) * 100;

    // Determine color based on percentage
    let fillColor = props.colorNormal;
    if (percentage < 25) {
        fillColor = props.colorDanger;
    } else if (percentage < 50) {
        fillColor = props.colorWarning;
    }

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = props.colorNormal;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Fill
    const fillWidth = (props.value / props.maxValue) * width;
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, fillWidth, height);

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;

    const text = `${props.label} ${Math.round(percentage)}%`;
    ctx.fillText(text, x + width / 2, y + height / 2);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
}
