export function generateSoothingColors(count:any) {
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        // Generate colors in the soothing range (lower saturation, higher lightness)
        const baseHue = Math.random() * 360; // Random hue (0-359)
        const saturation = 40 + Math.random() * 40; // 20-60% saturation (lower = more pastel)
        const lightness = 35 + Math.random() * 25; // 60-85% lightness (higher = lighter)
        
        // Convert HSL to RGB
        const hslToRgb = (h:any, s:any, l:any) => {
            h /= 360;
            s /= 100;
            l /= 100;
            
            let r:any, g:any, b:any;
            
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p:any, q:any, t:any) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        };
        
        const [r, g, b] = hslToRgb(baseHue, saturation, lightness);
        
        // Convert RGB to hex
        const toHex = (value:any) => {
            const hex = value.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        colors.push(hexColor);
    }
    
    return colors;
}