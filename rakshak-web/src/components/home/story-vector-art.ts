/** Bespoke vector-illustrated 2D Canvas painters styled with warm cel-shading, smooth Bézier curves, and cinematic depth */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function remap(v: number, inMin: number, inMax: number): number {
  return clamp01((v - inMin) / (inMax - inMin));
}

export function smoothstep(v: number): number {
  return v * v * (3 - 2 * v);
}

/** Paint vibrant sky gradient, glowing radial sun, drifting clouds, flying birds, faceted mountains & foliage */
export function drawEnvironmentBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  panX: number,
  horizonY: number,
  timeSec: number,
  isHighwayPerspective: boolean,
  p: number,
) {
  // 1. Vibrant sky gradient (padded horizontally so camera panning never exposes edges)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY + 40);
  skyGrad.addColorStop(0, "#38b6f2");
  skyGrad.addColorStop(0.58, "#8fd8fc");
  skyGrad.addColorStop(1, "#e1f4fd");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-w * 0.4, -h * 0.2, w * 1.8, horizonY + h * 0.35);

  // 2. Glowing golden sun
  const sunX = w * 0.16 - panX * 0.08;
  const sunY = h * 0.19;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, w * 0.015, sunX, sunY, w * 0.14);
  sunGlow.addColorStop(0, "rgba(253, 224, 71, 0.95)");
  sunGlow.addColorStop(0.32, "rgba(250, 204, 21, 0.42)");
  sunGlow.addColorStop(1, "rgba(250, 204, 21, 0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, w * 0.14, 0, Math.PI * 2);
  ctx.fill();

  // 3. Soft stylized drifting clouds
  const clouds = [
    { x: 0.34, y: 0.14, s: 1.0, speed: 0.004 },
    { x: 0.65, y: 0.17, s: 0.85, speed: 0.003 },
    { x: 0.86, y: 0.12, s: 1.1, speed: 0.0035 },
  ];
  for (const c of clouds) {
    const cx = ((c.x + timeSec * c.speed) % 1.2) * w - w * 0.1 - panX * 0.12;
    const cy = h * c.y;
    ctx.fillStyle = "rgba(255, 255, 255, 0.58)";
    ctx.beginPath();
    ctx.arc(cx, cy, 24 * c.s, 0, Math.PI * 2);
    ctx.arc(cx + 22 * c.s, cy - 8 * c.s, 28 * c.s, 0, Math.PI * 2);
    ctx.arc(cx + 46 * c.s, cy + 2 * c.s, 22 * c.s, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Flying bird silhouettes top-right
  ctx.strokeStyle = "rgba(30, 41, 59, 0.68)";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  const birds = [
    [0.68, 0.13, 1.0],
    [0.72, 0.16, 0.8],
    [0.75, 0.12, 0.9],
    [0.79, 0.18, 0.75],
    [0.81, 0.14, 1.1],
  ];
  for (const [bx, by, bs] of birds) {
    const x = w * bx - panX * 0.1 - (timeSec * 6) % 24;
    const y = h * by + Math.sin(timeSec * 3 + bx * 12) * 2.5;
    const wing = 11 * bs;
    ctx.beginPath();
    ctx.moveTo(x - wing, y + 3 * bs);
    ctx.quadraticCurveTo(x - wing * 0.45, y - 5 * bs, x, y);
    ctx.quadraticCurveTo(x + wing * 0.45, y - 5 * bs, x + wing, y + 3 * bs);
    ctx.stroke();
  }

  // 5. Layered faceted snow-lit mountains along horizon
  const mtnShift = -panX * 0.18;
  const peaks = [
    { x: -0.05, w: 0.28, top: 0.36 },
    { x: 0.14, w: 0.24, top: 0.39 },
    { x: 0.38, w: 0.3, top: 0.42 },
    { x: 0.6, w: 0.28, top: 0.35 },
    { x: 0.8, w: 0.3, top: 0.38 },
  ];
  for (const pk of peaks) {
    const px = w * pk.x + mtnShift;
    const pw = w * pk.w;
    const py = horizonY * pk.top + horizonY * 0.28;
    const mid = px + pw * 0.48;

    // Lit left slope
    ctx.fillStyle = "#b8daf6";
    ctx.beginPath();
    ctx.moveTo(px, horizonY + 8);
    ctx.lineTo(mid, py);
    ctx.lineTo(mid + pw * 0.04, horizonY + 8);
    ctx.closePath();
    ctx.fill();

    // Shaded right slope
    ctx.fillStyle = "#77a5d6";
    ctx.beginPath();
    ctx.moveTo(mid, py);
    ctx.lineTo(px + pw, horizonY + 8);
    ctx.lineTo(mid + pw * 0.04, horizonY + 8);
    ctx.closePath();
    ctx.fill();
  }

  // 6. Sunlit olive-lime distant rolling grass band (padded horizontally)
  const fieldGrad = ctx.createLinearGradient(0, horizonY - 4, 0, h);
  fieldGrad.addColorStop(0, "#9ab916");
  fieldGrad.addColorStop(0.35, "#7ea310");
  fieldGrad.addColorStop(1, "#5c7a0c");
  ctx.fillStyle = fieldGrad;
  ctx.fillRect(-w * 0.4, horizonY, w * 1.8, h * 1.4 - horizonY);

  // Rolling bush/shrub silhouettes along horizon
  const bushes = [0.06, 0.24, 0.76, 0.92];
  for (const b of bushes) {
    const bx = w * b - panX * 0.32;
    ctx.fillStyle = "#7c9b11";
    ctx.beginPath();
    ctx.arc(bx, horizonY + 4, 28, Math.PI, 0);
    ctx.arc(bx + 26, horizonY + 4, 20, Math.PI, 0);
    ctx.fill();
  }

  if (isHighwayPerspective) {
    // Highway converging road with tire skid marks & centerline
    const roadTopW = w * 0.065;
    const roadBotW = w * 0.86;
    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    roadGrad.addColorStop(0, "#3b4254");
    roadGrad.addColorStop(1, "#1e2433");
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - roadTopW * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + roadTopW * 0.5, horizonY);
    ctx.lineTo(w * 0.5 + roadBotW * 0.5, h);
    ctx.lineTo(w * 0.5 - roadBotW * 0.5, h);
    ctx.closePath();
    ctx.fill();

    // Side road stripes
    ctx.strokeStyle = "rgba(226, 244, 240, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - roadTopW * 0.44, horizonY);
    ctx.lineTo(w * 0.5 - roadBotW * 0.43, h);
    ctx.moveTo(w * 0.5 + roadTopW * 0.44, horizonY);
    ctx.lineTo(w * 0.5 + roadBotW * 0.43, h);
    ctx.stroke();

    // Dashed centerline moving subtly with progress
    ctx.strokeStyle = "rgba(241, 245, 249, 0.92)";
    ctx.lineWidth = 7;
    ctx.setLineDash([28, 22]);
    ctx.lineDashOffset = -(p * 900);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, horizonY + 4);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Stylized warm yellow & green trees flanking highway
    drawIllustratedTree(ctx, w * 0.05, horizonY + 26, 1.05, true);
    drawIllustratedTree(ctx, w * 0.31, horizonY + 12, 0.65, true);
    drawIllustratedTree(ctx, w * 0.62, horizonY + 10, 0.52, false);
    drawIllustratedTree(ctx, w * 0.9, horizonY + 34, 1.18, true);
  } else {
    // Street intersection perspective (curb, asphalt, zebra crossing, trees, traffic signal)
    const roadY = h * 0.65;

    // Distant sidewalk curb (padded horizontally)
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-w * 0.4, roadY - 14, w * 1.8, 16);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(-w * 0.4, roadY, w * 1.8, 5);

    // Trees behind sidewalk
    drawIllustratedTree(ctx, w * 0.09 - panX * 0.35, roadY - 12, 0.78, true);
    drawIllustratedTree(ctx, w * 0.34 - panX * 0.35, roadY - 12, 0.62, false);
    drawIllustratedTree(ctx, w * 0.78 - panX * 0.35, roadY - 12, 0.74, true);

    // Asphalt road (padded horizontally & vertically)
    const roadGrad = ctx.createLinearGradient(0, roadY, 0, h);
    roadGrad.addColorStop(0, "#334155");
    roadGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = roadGrad;
    ctx.fillRect(-w * 0.4, roadY, w * 1.8, h * 1.4 - roadY);

    // Zebra crossing stripes cleanly placed across intersection
    ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
    const crossBaseX = w * 0.38 - panX * 0.75;
    for (let i = 0; i < 6; i++) {
      const sy = roadY + 18 + i * 26;
      const sw = 105 + i * 16;
      const skew = i * 12;
      ctx.beginPath();
      ctx.moveTo(crossBaseX - skew, sy);
      ctx.lineTo(crossBaseX + sw - skew, sy);
      ctx.lineTo(crossBaseX + sw - skew - 8, sy + 14);
      ctx.lineTo(crossBaseX - skew - 8, sy + 14);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawIllustratedTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  scale: number,
  warmYellow: boolean,
) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.scale(scale, scale);

  // Curved natural trunk + fork
  ctx.strokeStyle = "#6e4e2e";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -40, 0, -76);
  ctx.moveTo(0, -45);
  ctx.quadraticCurveTo(-16, -62, -24, -76);
  ctx.moveTo(0, -52);
  ctx.quadraticCurveTo(18, -68, 24, -82);
  ctx.stroke();

  // Lush foliage clusters
  const backGreen = "#659315";
  const topColor = warmYellow ? "#fbe14b" : "#9dc927";
  const topHighlight = warmYellow ? "#fef08a" : "#bef264";

  ctx.fillStyle = backGreen;
  for (const [cx, cy, r] of [
    [-26, -78, 26],
    [28, -80, 28],
    [0, -74, 30],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = topColor;
  for (const [cx, cy, r] of [
    [-22, -96, 28],
    [22, -96, 26],
    [0, -114, 34],
  ]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = topHighlight;
  ctx.beginPath();
  ctx.arc(-8, -124, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Traffic signal pole just like the reference intersection shot */
export function drawTrafficSignal(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  scale: number,
  redActive: boolean,
) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  // Pole
  ctx.fillStyle = "#94a3b8";
  ctx.fillRect(-5, -240, 10, 240);
  ctx.fillStyle = "#64748b";
  ctx.fillRect(0, -240, 5, 240);

  // Signal housing
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.roundRect(-24, -295, 48, 126, 12);
  ctx.fill();

  // Hood visors & glowing lamps
  const lamps = [
    { y: -268, color: redActive ? "#ef4444" : "#7f1d1d", glow: redActive },
    { y: -232, color: "#ca8a04", glow: false },
    { y: -196, color: redActive ? "#14532d" : "#22c55e", glow: !redActive },
  ];
  for (const lamp of lamps) {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(0, lamp.y, 14, 0, Math.PI * 2);
    ctx.fill();

    if (lamp.glow) {
      ctx.shadowColor = lamp.color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = lamp.color;
    ctx.beginPath();
    ctx.arc(0, lamp.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

/** Sleek glossy blue sports-sedan in Highway Front View (matching Screenshot #2!) */
export function drawSedanFrontView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft ground contact shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 98, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tires
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.roundRect(-84, -30, 26, 36, 6);
  ctx.roundRect(58, -30, 26, 36, 6);
  ctx.fill();

  // Lower body shell
  const bodyGrad = ctx.createLinearGradient(0, -110, 0, -5);
  bodyGrad.addColorStop(0, "#1d73c4");
  bodyGrad.addColorStop(0.55, "#0d57a3");
  bodyGrad.addColorStop(1, "#083a70");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-88, -22);
  ctx.quadraticCurveTo(-92, -62, -70, -76);
  ctx.lineTo(-50, -124);
  ctx.quadraticCurveTo(0, -134, 50, -124);
  ctx.lineTo(70, -76);
  ctx.quadraticCurveTo(92, -62, 88, -22);
  ctx.quadraticCurveTo(86, -8, 60, -8);
  ctx.lineTo(-60, -8);
  ctx.quadraticCurveTo(-86, -8, -88, -22);
  ctx.closePath();
  ctx.fill();

  // Side wing mirrors
  ctx.fillStyle = "#0e64b8";
  ctx.beginPath();
  ctx.roundRect(-86, -86, 20, 11, 5);
  ctx.roundRect(66, -86, 20, 11, 5);
  ctx.fill();

  // Tinted glossy windshield with subtle diagonal highlight
  const glassGrad = ctx.createLinearGradient(-40, -120, 40, -75);
  glassGrad.addColorStop(0, "#1e293b");
  glassGrad.addColorStop(0.45, "#0f172a");
  glassGrad.addColorStop(0.7, "#334155");
  glassGrad.addColorStop(1, "#0f172a");
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.moveTo(-58, -76);
  ctx.lineTo(-42, -116);
  ctx.quadraticCurveTo(0, -122, 42, -116);
  ctx.lineTo(58, -76);
  ctx.closePath();
  ctx.fill();

  // Hood sculpt creases
  ctx.strokeStyle = "rgba(186, 230, 253, 0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-46, -70);
  ctx.lineTo(-56, -45);
  ctx.moveTo(46, -70);
  ctx.lineTo(56, -45);
  ctx.stroke();

  // Front air intakes & grille
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.roundRect(-42, -36, 84, 18, 6);
  ctx.fill();
  for (const sx of [-62, 62]) {
    ctx.beginPath();
    ctx.ellipse(sx, -34, 15, 8, sx < 0 ? 0.2 : -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glossy curved headlights + glowing daytime LEDs
  for (const sx of [-63, 63]) {
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.ellipse(sx, -56, 17, 10, sx < 0 ? -0.35 : 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef9c3";
    ctx.beginPath();
    ctx.arc(sx - (sx < 0 ? 3 : -3), -56, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Front fog lamps
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.arc(-62, -26, 3.2, 0, Math.PI * 2);
  ctx.arc(62, -26, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Detailed glossy blue SUV/sedan in 3/4 street angle, with optional windshield cracks, smoke & hazards */
export function drawSedanQuarterView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  options: {
    damaged: boolean;
    smokeIntensity: number;
    hazardBlink: boolean;
    timeSec: number;
  },
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 158, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear & Front alloy wheels
  for (const wx of [-92, 66]) {
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.arc(wx, -16, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d4d4d8";
    ctx.beginPath();
    ctx.arc(wx, -16, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#71717a";
    ctx.lineWidth = 2.5;
    for (let s = 0; s < 5; s++) {
      const a = (s / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(wx, -16);
      ctx.lineTo(wx + Math.cos(a) * 14, -16 + Math.sin(a) * 14);
      ctx.stroke();
    }
  }

  // Main painted body silhouette facing right (+X)
  const carGrad = ctx.createLinearGradient(-130, -120, 140, -10);
  carGrad.addColorStop(0, "#1e3a8a");
  carGrad.addColorStop(0.55, "#1d4ed8");
  carGrad.addColorStop(1, "#1e40af");
  ctx.fillStyle = carGrad;

  ctx.beginPath();
  ctx.moveTo(-142, -26);
  ctx.lineTo(-148, -62);
  ctx.lineTo(-110, -116);
  ctx.quadraticCurveTo(-30, -126, 28, -114);
  ctx.lineTo(74, -76);
  ctx.quadraticCurveTo(138, -68, 150, -34);
  ctx.lineTo(144, -16);
  ctx.lineTo(-136, -16);
  ctx.closePath();
  ctx.fill();

  // Subtle metallic highlight stripe along doors
  ctx.fillStyle = "rgba(147, 197, 253, 0.25)";
  ctx.beginPath();
  ctx.roundRect(-105, -62, 175, 8, 4);
  ctx.fill();

  // Side windows + front windshield
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(-98, -76);
  ctx.lineTo(-78, -108);
  ctx.lineTo(22, -106);
  ctx.lineTo(62, -74);
  ctx.closePath();
  ctx.fill();

  // Window B-pillar divider
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-26, -108);
  ctx.lineTo(-22, -74);
  ctx.stroke();

  // Side mirror
  ctx.fillStyle = "#1d4ed8";
  ctx.beginPath();
  ctx.roundRect(14, -78, 16, 10, 4);
  ctx.fill();

  // Front grille + curved headlight + tail light
  ctx.fillStyle = "#09090b";
  ctx.beginPath();
  ctx.roundRect(126, -42, 22, 18, 4);
  ctx.fill();

  ctx.fillStyle = "#fef9c3";
  ctx.beginPath();
  ctx.ellipse(122, -52, 15, 7, -0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.roundRect(-149, -62, 10, 14, 3);
  ctx.fill();

  if (options.hazardBlink) {
    ctx.fillStyle = "#f59e0b";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(134, -50, 4.5, 0, Math.PI * 2);
    ctx.arc(-144, -46, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Impact spiderweb cracks & curling smoke just like Screenshot #1!
  if (options.damaged) {
    ctx.strokeStyle = "rgba(226, 232, 240, 0.85)";
    ctx.lineWidth = 1.6;
    const cx = 36;
    const cy = -88;
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 1.4 - 0.8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 26, cy + Math.sin(ang) * 16);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 11, -0.8, 2.2);
    ctx.stroke();
  }

  if (options.smokeIntensity > 0.02) {
    for (let i = 0; i < 6; i++) {
      const cycle = (options.timeSec * 0.45 + i * 0.19) % 1;
      const sx = 112 + Math.sin(cycle * 5 + i) * 16;
      const sy = -66 - cycle * 115;
      const r = 10 + cycle * 26;
      ctx.fillStyle = `rgba(226, 232, 240, ${(1 - cycle) * 0.34 * options.smokeIntensity})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/** Detailed vector ambulance side profile (facingRight=true drives Left -> Right nose-first) */
export function drawAmbulanceSideRear(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  options: {
    facingRight?: boolean;
    doorOpenT: number;
    strobeOn: boolean;
    timeSec: number;
  },
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(options.facingRight ? -scale : scale, scale);

  // Ground shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
  ctx.beginPath();
  ctx.ellipse(0, 6, 175, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear & Front wheels
  for (const wx of [-98, 92]) {
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.arc(wx, -16, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e4e4e7";
    ctx.beginPath();
    ctx.arc(wx, -16, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main ambulance body shell (nose -X, rear +X; flipped cleanly when facingRight=true)
  const bodyGrad = ctx.createLinearGradient(-150, -160, 140, -20);
  bodyGrad.addColorStop(0, "#ffffff");
  bodyGrad.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = bodyGrad;

  ctx.beginPath();
  ctx.moveTo(-162, -26);
  ctx.lineTo(-162, -66);
  ctx.lineTo(-116, -138);
  ctx.lineTo(-60, -158);
  ctx.lineTo(154, -158);
  ctx.lineTo(154, -22);
  ctx.lineTo(-154, -22);
  ctx.closePath();
  ctx.fill();

  // Side crimson & lime reflective safety stripes
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-52, -78, 198, 14);
  ctx.fillStyle = "#d0e957";
  ctx.fillRect(-52, -85, 198, 6);

  // Side 3D medical cross + side compartment window
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-6, -136, 12, 36);
  ctx.fillRect(-18, -124, 36, 12);

  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(44, -138, 52, 34, 6);
  ctx.fill();

  // Cab windshield & door window
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.moveTo(-144, -76);
  ctx.lineTo(-112, -132);
  ctx.lineTo(-76, -132);
  ctx.lineTo(-76, -76);
  ctx.closePath();
  ctx.fill();

  // Headlight + tail light
  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.roundRect(-163, -58, 12, 14, 4);
  ctx.fill();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.roundRect(148, -56, 8, 16, 3);
  ctx.fill();

  // Emergency roof strobe lightbar
  const flash = Math.sin(options.timeSec * 12) > 0;
  ctx.fillStyle = "#18181b";
  ctx.fillRect(-98, -168, 54, 10);

  const redColor = options.strobeOn && flash ? "#ef4444" : "#991b1b";
  const blueColor = options.strobeOn && !flash ? "#3b82f6" : "#1e3a8a";
  if (options.strobeOn) {
    ctx.shadowColor = flash ? "#ef4444" : "#3b82f6";
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = redColor;
  ctx.fillRect(-95, -172, 24, 11);
  ctx.fillStyle = blueColor;
  ctx.fillRect(-71, -172, 24, 11);
  ctx.shadowBlur = 0;

  ctx.restore();
}

/** Cinematic Rear 3/4 View of the Ambulance showing back windows, openable double doors & illuminated medical interior */
export function drawAmbulanceRearView(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  options: {
    doorOpenT: number; // 0 = closed, 1 = wide open
    strobeOn: boolean;
    timeSec: number;
  },
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Soft ground shadow
  ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 145, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear tires peeking neatly at outer corners
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.roundRect(-114, -30, 32, 40, 7);
  ctx.roundRect(82, -30, 32, 40, 7);
  ctx.fill();

  // Outer rear body frame (white/silver)
  const frameGrad = ctx.createLinearGradient(0, -230, 0, -16);
  frameGrad.addColorStop(0, "#ffffff");
  frameGrad.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = frameGrad;
  ctx.beginPath();
  ctx.roundRect(-116, -228, 232, 214, 18);
  ctx.fill();

  // Roof emergency lightbar + brow marker lights
  const flash = Math.sin(options.timeSec * 12) > 0;
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.roundRect(-84, -242, 168, 16, 6);
  ctx.fill();

  if (options.strobeOn) {
    ctx.shadowColor = flash ? "#ef4444" : "#3b82f6";
    ctx.shadowBlur = 20;
  }
  ctx.fillStyle = options.strobeOn && flash ? "#ef4444" : "#991b1b";
  ctx.fillRect(-80, -245, 68, 15);
  ctx.fillStyle = options.strobeOn && !flash ? "#3b82f6" : "#1e3a8a";
  ctx.fillRect(12, -245, 68, 15);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-12, -245, 24, 15);

  // Lower crimson & lime chevron bumper bar + rear tail lights
  ctx.fillStyle = "#334155";
  ctx.beginPath();
  ctx.roundRect(-118, -28, 236, 20, 6);
  ctx.fill();

  for (const sx of [-104, 86]) {
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.roundRect(sx, -78, 18, 42, 4);
    ctx.fill();
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(sx + 2, -48, 14, 10);
  }

  // Open medical cabin interior (recessed behind doors!)
  const interiorGrad = ctx.createLinearGradient(0, -210, 0, -32);
  interiorGrad.addColorStop(0, "#334155");
  interiorGrad.addColorStop(0.55, "#1e293b");
  interiorGrad.addColorStop(1, "#64748b");
  ctx.fillStyle = interiorGrad;
  ctx.beginPath();
  ctx.roundRect(-90, -210, 180, 178, 8);
  ctx.fill();

  // Warm interior dome LED light & medical supply cabinet silhouette
  ctx.fillStyle = "rgba(254, 249, 195, 0.85)";
  ctx.beginPath();
  ctx.ellipse(0, -198, 44, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.fillRect(-84, -172, 34, 128);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-76, -158, 18, 28); // red first-aid kit inside bay

  // Metallic loading ramp deck floor
  ctx.fillStyle = "#cbd5e1";
  ctx.beginPath();
  ctx.moveTo(-88, -32);
  ctx.lineTo(88, -32);
  ctx.lineTo(100, -16);
  ctx.lineTo(-100, -16);
  ctx.closePath();
  ctx.fill();

  // Articulated Left & Right Rear Doors (each door shrinks foreshortening width cleanly outward around hinge!)
  const open = clamp01(options.doorOpenT);
  const drawRearDoor = (isLeft: boolean) => {
    const hingeX = isLeft ? -92 : 92;
    const closedWidth = 91;
    // Perspective foreshortening + swing out past body edge as door rotates 130° outward
    const angle = open * 2.22;
    const projX = Math.cos(angle) * closedWidth;
    const swingOutY = Math.sin(angle) * 14;

    ctx.save();
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(hingeX, -210);
      ctx.lineTo(hingeX + projX, -210 + swingOutY);
      ctx.lineTo(hingeX + projX, -32 + swingOutY);
      ctx.lineTo(hingeX, -32);
    } else {
      ctx.moveTo(hingeX, -210);
      ctx.lineTo(hingeX - projX, -210 + swingOutY);
      ctx.lineTo(hingeX - projX, -32 + swingOutY);
      ctx.lineTo(hingeX, -32);
    }
    ctx.closePath();
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Door Rear Window & Reflective Crimson/Lime Stripe (scales smoothly with projX!)
    const absProj = Math.abs(projX);
    if (absProj > 16) {
      const sign = isLeft ? 1 : -1;
      // Rear window
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(
        hingeX + sign * absProj * 0.16,
        -194 + swingOutY * 0.5,
        sign * absProj * 0.68,
        58,
      );
      // Crimson & lime rear warning stripe
      ctx.fillStyle = "#dc2626";
      ctx.fillRect(hingeX, -98 + swingOutY * 0.5, sign * absProj, 22);
      ctx.fillStyle = "#d0e957";
      ctx.fillRect(hingeX, -106 + swingOutY * 0.5, sign * absProj, 7);

      // Door handle & medical cross accent when closed/ajar
      ctx.fillStyle = "#64748b";
      ctx.fillRect(hingeX + sign * absProj * 0.84, -126 + swingOutY * 0.8, sign * 5, 18);
    }
    ctx.restore();
  };

  drawRearDoor(true);
  drawRearDoor(false);

  ctx.restore();
}

/** Wheeled emergency stretcher gurney */
export function drawStretcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // X-frame legs + caster wheels
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-42, -32);
  ctx.lineTo(42, -4);
  ctx.moveTo(42, -32);
  ctx.lineTo(-42, -4);
  ctx.stroke();

  ctx.fillStyle = "#18181b";
  for (const cx of [-42, 42]) {
    ctx.beginPath();
    ctx.arc(cx, -2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bed frame + dark cushion + pillow + amber side rail
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.roundRect(-56, -42, 112, 11, 5);
  ctx.fill();

  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.roundRect(-50, -49, 22, 8, 4);
  ctx.fill();

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.roundRect(-34, -50, 72, 6, 3);
  ctx.fill();

  ctx.restore();
}

export type PersonPose =
  | "idle"
  | "walk"
  | "back-foreground"
  | "shock"
  | "fallen"
  | "reach-pocket"
  | "hold-phone"
  | "aim-photo"
  | "bend-lift"
  | "paramedic-carry";

export interface VectorPersonStyle {
  shirt: string;
  shirtShade: string;
  pants: string;
  skin: string;
  hair: string;
  vest?: string;
}

/** Smooth vector anatomical character with natural curves, face expression, back-view support, and hands/phone */
export function drawVectorPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  facingRight: boolean,
  style: VectorPersonStyle,
  pose: PersonPose,
  poseAmount = 1,
  flashGlow = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  if (pose === "fallen") {
    // Injured pedestrian lying horizontally along crosswalk
    ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 58, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = style.pants;
    ctx.beginPath();
    ctx.roundRect(6, -14, 48, 12, 6);
    ctx.fill();
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.roundRect(50, -16, 11, 13, 4);
    ctx.fill();

    // Torso
    ctx.fillStyle = style.shirt;
    ctx.beginPath();
    ctx.roundRect(-34, -18, 44, 18, 8);
    ctx.fill();

    // Head resting
    ctx.fillStyle = style.skin;
    ctx.beginPath();
    ctx.arc(-44, -12, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.arc(-47, -14, 13, Math.PI * 0.65, Math.PI * 1.9);
    ctx.fill();

    ctx.restore();
    return;
  }

  if (!facingRight) {
    ctx.scale(-1, 1);
  }

  const isBackView = pose === "back-foreground";

  // Ground shadow
  if (!isBackView) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trousers & shoes (supports animated walking stride via poseAmount)
  const stride = pose === "walk" ? Math.sin(poseAmount * 18) * 14 : 0;
  ctx.fillStyle = style.pants;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-14, -76);
  ctx.lineTo(-2, -76);
  ctx.lineTo(-2 - stride * 0.8, -4);
  ctx.lineTo(-14 - stride * 0.8, -4);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(2, -76);
  ctx.lineTo(14, -76);
  ctx.lineTo(14 + stride * 0.8, -4);
  ctx.lineTo(2 + stride * 0.8, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (!isBackView) {
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(-16 - stride * 0.8, -8, 18, 8, 4);
    ctx.roundRect(1 + stride * 0.8, -8, 18, 8, 4);
    ctx.fill();
  }

  // Forward torso lean for paramedics lifting victim gently
  const leanRad = pose === "bend-lift" ? 0.34 * poseAmount : 0;
  ctx.save();
  ctx.translate(0, -74);
  ctx.rotate(leanRad);
  ctx.translate(0, 74);

  // Tapered natural torso with cel shading
  const torsoGrad = ctx.createLinearGradient(-22, -138, 22, -74);
  torsoGrad.addColorStop(0, style.shirt);
  torsoGrad.addColorStop(1, style.shirtShade);
  ctx.fillStyle = torsoGrad;

  ctx.beginPath();
  ctx.moveTo(-21, -132);
  ctx.quadraticCurveTo(0, -142, 22, -132);
  ctx.quadraticCurveTo(25, -104, 18, -74);
  ctx.lineTo(-18, -74);
  ctx.quadraticCurveTo(-24, -104, -21, -132);
  ctx.closePath();
  ctx.fill();

  // Optional paramedic high-vis vest stripe
  if (style.vest) {
    ctx.fillStyle = style.vest;
    ctx.fillRect(-19, -98, 38, 8);
    ctx.fillRect(-12, -134, 6, 38);
    ctx.fillRect(6, -134, 6, 38);
  }

  // Natural Neck + Sculpted Head (Front/3-4 OR Over-the-Shoulder Back View matching Screenshot #1!)
  ctx.fillStyle = style.skin;
  ctx.beginPath();
  ctx.roundRect(-7, -148, 14, 18, 5);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(isBackView ? 2 : 0, -162, 16, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isBackView) {
    // Full natural back/side-profile hair crown + nape + ear (no forehead gap)
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.arc(0, -165, 17.5, Math.PI * 0.48, Math.PI * 2.08);
    ctx.quadraticCurveTo(8, -168, 2, -152);
    ctx.quadraticCurveTo(-8, -148, -15, -155);
    ctx.closePath();
    ctx.fill();

    // Sculpted ear facing viewer
    ctx.fillStyle = style.skin;
    ctx.beginPath();
    ctx.ellipse(-4, -158, 3.8, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Expressive front / 3-4 face with full smooth hair cap
    ctx.fillStyle = style.hair;
    ctx.beginPath();
    ctx.arc(-1, -166, 17.2, Math.PI * 0.78, Math.PI * 2.12);
    ctx.quadraticCurveTo(6, -173, -15, -156);
    ctx.closePath();
    ctx.fill();

    // Ear on back edge
    ctx.fillStyle = style.skin;
    ctx.beginPath();
    ctx.ellipse(-14, -160, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrows & Expressive Eyes
    ctx.fillStyle = "#18181b";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#18181b";
    ctx.beginPath();
    ctx.moveTo(0, -167);
    ctx.lineTo(6, -168.5);
    ctx.moveTo(10, -168.5);
    ctx.lineTo(15, -167);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(3.5, -163, 3.2, 2.4, 0, 0, Math.PI * 2);
    ctx.ellipse(12, -163, 2.8, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.arc(4.2, -163, 1.5, 0, Math.PI * 2);
    ctx.arc(12.6, -163, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Nose hint & mouth expression
    ctx.strokeStyle = "rgba(124, 45, 18, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(9, -162);
    ctx.lineTo(11, -157);
    ctx.stroke();

    ctx.fillStyle = pose === "shock" ? "#7f1d1d" : "#9a3412";
    ctx.beginPath();
    if (pose === "shock") {
      ctx.ellipse(8, -151, 3.2, 4, 0, 0, Math.PI * 2);
    } else {
      ctx.roundRect(5.5, -152.5, 6, 2.2, 1);
    }
    ctx.fill();
  }

  // Articulated Arms & Hands per pose
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawArmSegment = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    hx: number,
    hy: number,
    sleeveColor: string,
  ) => {
    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Hand with sculpted palm/fingers
    ctx.fillStyle = style.skin;
    ctx.beginPath();
    ctx.arc(hx, hy, 5.5, 0, Math.PI * 2);
    ctx.fill();
  };

  if (pose === "back-foreground") {
    drawArmSegment(-20, -126, -24, -98, -22, -72, style.shirt);
    drawArmSegment(20, -126, 25, -98, 22, -72, style.shirtShade);
  } else if (pose === "shock") {
    drawArmSegment(14, -124, 24, -112, 16, -98, style.shirt);
    drawArmSegment(-12, -124, -22, -112, -14, -98, style.shirtShade);
  } else if (pose === "reach-pocket") {
    drawArmSegment(-15, -126, -20, -100, -16, -78, style.shirtShade);
    const pull = poseAmount;
    const ex = lerp(18, 28, pull);
    const ey = lerp(-96, -104, pull);
    const hx = lerp(12, 34, pull);
    const hy = lerp(-76, -108, pull);
    drawArmSegment(16, -126, ex, ey, hx, hy, style.shirt);
    if (pull > 0.35) {
      drawPhoneInHand(ctx, hx, hy, -0.35, 0);
    }
  } else if (pose === "hold-phone" || pose === "aim-photo") {
    const aim = pose === "aim-photo" ? poseAmount : 0;
    const px = lerp(34, 44, aim);
    const py = lerp(-124, -138, aim);
    drawArmSegment(-12, -124, 14, -110, px - 4, py + 4, style.shirtShade);
    drawArmSegment(14, -126, 26, -108, px, py, style.shirt);
    drawPhoneInHand(ctx, px, py, lerp(-0.18, 0.04, aim), flashGlow);
  } else if (pose === "bend-lift") {
    const reach = poseAmount;
    drawArmSegment(-10, -124, 14, -96, 28 + reach * 12, -78 + reach * 8, style.shirtShade);
    drawArmSegment(14, -124, 24, -96, 36 + reach * 12, -76 + reach * 8, style.shirt);
  } else if (pose === "paramedic-carry") {
    drawArmSegment(-12, -124, 14, -110, 34, -100, style.shirtShade);
    drawArmSegment(14, -124, 22, -108, 36, -98, style.shirt);
  } else {
    const armSwing = pose === "walk" ? Math.sin(poseAmount * 18) * 10 : 0;
    drawArmSegment(-16, -126, -18, -100, -16 + armSwing, -76, style.shirtShade);
    drawArmSegment(16, -126, 20, -100, 18 - armSwing, -76, style.shirt);
  }

  ctx.restore();
  ctx.restore();
}

function drawPhoneInHand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tiltRad: number,
  flashGlow: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tiltRad);

  // Authentic narrow LED camera flash cone only if flashGlow > 0
  if (flashGlow > 0.03) {
    const beam = ctx.createLinearGradient(5, -6, 130, 12);
    beam.addColorStop(0, `rgba(255, 251, 235, ${0.72 * flashGlow})`);
    beam.addColorStop(1, "rgba(255, 251, 235, 0)");
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(5, -8);
    ctx.lineTo(135, -38);
    ctx.lineTo(135, 32);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#fef08a";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(5, -8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Smartphone chassis held cleanly in hand
  ctx.fillStyle = "#18181b";
  ctx.beginPath();
  ctx.roundRect(-4, -13, 8, 22, 2.5);
  ctx.fill();

  // Soft RAKSHAK screen glow facing helper
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-3.8, -10, 2, 16);

  ctx.restore();
}

/** Dynamic spiky starburst + bold "HIT!" impact graphic shown strictly at moment of car collision */
export function drawImpactHitBurst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  intensity: number,
) {
  if (intensity <= 0.02) return;
  ctx.save();
  ctx.translate(x, y);
  const popScale = scale * (0.45 + 0.65 * intensity);
  ctx.scale(popScale, popScale);
  ctx.globalAlpha = clamp01(intensity * 1.3);

  // Outer red comic starburst (12 spikes)
  const spikes = 12;
  ctx.fillStyle = "#ef4444";
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 54 : 26;
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner bright amber-yellow flash burst
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 38 : 18;
    const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2 + 0.14;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Bold "HIT!" impact label
  ctx.font = "900 18px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#18181b";
  ctx.strokeText("HIT!", 0, 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillText("HIT!", 0, 1);

  ctx.restore();
}
