import React, { useEffect, useMemo, useRef, useState } from "react";
import type { GraphSpec, MathematicalGraphSpec } from "@/types";

interface PlotlyGraphProps {
	graphSpec: GraphSpec;
	width?: number;
	height?: number;
	cameraState?: {
		position: [number, number, number];
		rotation: [number, number, number];
		zoom: number;
	};
	onCameraChange?: (cameraState: {
		position: [number, number, number];
		rotation: [number, number, number];
		zoom: number;
	}) => void;
}

// Safely evaluate expressions similar to ThreeJSGraph
const evaluateExpression = (
	expression: string,
	variable: string,
	value: number,
	variable2?: string,
	value2?: number
): number => {
	try {
		let clean = expression.replace(/\^/g, "**").replace(/\bpi\b/g, "Math.PI").replace(/\be\b/g, "Math.E");
		const scope = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, exp: Math.exp, log: Math.log, log10: Math.log10, sqrt: Math.sqrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round, min: Math.min, max: Math.max, pow: Math.pow, Math };
		if (variable2 !== undefined && value2 !== undefined) {
			const f = new Function(variable, variable2, ...Object.keys(scope), `return ${clean}`);
			return f(value, value2, ...Object.values(scope));
		}
		const f = new Function(variable, ...Object.keys(scope), `return ${clean}`);
		return f(value, ...Object.values(scope));
	} catch {
		return 0;
	}
};

const clampResolution = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const PlotlyGraph: React.FC<PlotlyGraphProps> = ({ graphSpec, width = 400, height = 300, cameraState, onCameraChange }) => {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const plotlyRef = useRef<any>(null);
	const [plotlyAvailable, setPlotlyAvailable] = useState<boolean>(true);

	const mathSpec = graphSpec as MathematicalGraphSpec;

	const traces = useMemo(() => {
		if (!graphSpec || graphSpec.graphType !== "mathematical" || !mathSpec.plot) return [] as any[];
		const kind = mathSpec.plot.kind;
		const styleColor = mathSpec.style?.color || "#3b82f6";
		const toRGB = styleColor;

		if (kind === "2d_explicit") {
			const domain = mathSpec.plot.domain.x || [-10, 10];
			const res = clampResolution(mathSpec.plot.resolution || 1000, 100, 4000);
			const [xMin, xMax] = domain;
			const step = (xMax - xMin) / res;
			const xs: number[] = [], ys: number[] = [], zs: number[] = [];
			for (let i = 0; i <= res; i++) {
				const x = xMin + i * step;
				const y = evaluateExpression(mathSpec.plot.expressions?.yOfX || "0", "x", x);
				if (isFinite(y)) { xs.push(x); ys.push(y); zs.push(0); }
			}
			return [{ type: "scatter3d", mode: "lines", x: xs, y: ys, z: zs, line: { color: toRGB, width: 3 } }];
		}

		if (kind === "2d_parametric") {
			const domain = mathSpec.plot.domain.t || [0, 2 * Math.PI];
			const res = clampResolution(mathSpec.plot.resolution || 1000, 100, 4000);
			const [tMin, tMax] = domain;
			const step = (tMax - tMin) / res;
			const xs: number[] = [], ys: number[] = [], zs: number[] = [];
			for (let i = 0; i <= res; i++) {
				const t = tMin + i * step;
				const x = evaluateExpression(mathSpec.plot.expressions?.xOfT || "0", "t", t);
				const y = evaluateExpression(mathSpec.plot.expressions?.yOfT || "0", "t", t);
				if (isFinite(x) && isFinite(y)) { xs.push(x); ys.push(y); zs.push(0); }
			}
			return [{ type: "scatter3d", mode: "lines", x: xs, y: ys, z: zs, line: { color: toRGB, width: 3 } }];
		}

		if (kind === "2d_polar") {
			const domain = mathSpec.plot.domain.x || [0, 2 * Math.PI];
			const res = clampResolution(mathSpec.plot.resolution || 1000, 100, 4000);
			const [angMin, angMax] = domain;
			const step = (angMax - angMin) / res;
			const xs: number[] = [], ys: number[] = [], zs: number[] = [];
			for (let i = 0; i <= res; i++) {
				const theta = angMin + i * step;
				const r = evaluateExpression(mathSpec.plot.expressions?.rOfTheta || "0", "theta", theta);
				if (isFinite(r) && r >= 0) {
					xs.push(r * Math.cos(theta)); ys.push(r * Math.sin(theta)); zs.push(0);
				}
			}
			return [{ type: "scatter3d", mode: "lines", x: xs, y: ys, z: zs, line: { color: toRGB, width: 3 } }];
		}

		if (kind === "3d_surface" || kind === "3d_integral") {
			const domX = mathSpec.plot.domain.x || [-5, 5];
			const domY = mathSpec.plot.domain.y || [-5, 5];
			const res = clampResolution(mathSpec.plot.resolution || 100, 20, 300);
			const [xMin, xMax] = domX;
			const [yMin, yMax] = domY;
			const xVals: number[] = [], yVals: number[] = [];
			for (let i = 0; i <= res; i++) xVals.push(xMin + (i * (xMax - xMin)) / res);
			for (let j = 0; j <= res; j++) yVals.push(yMin + (j * (yMax - yMin)) / res);
			const zGrid: number[][] = [];
			for (let j = 0; j <= res; j++) {
				const row: number[] = [];
				for (let i = 0; i <= res; i++) {
					const x = xVals[i];
					const y = yVals[j];
					const z = evaluateExpression(mathSpec.plot.expressions?.surfaceZ || "0", "x", x, "y", y);
					row.push(isFinite(z) ? z : 0);
				}
				zGrid.push(row);
			}
			return [{ type: "surface", x: xVals, y: yVals, z: zGrid, colorscale: [[0, toRGB], [1, toRGB]], showscale: false, opacity: 0.9 }];
		}

		// Fallback empty
		return [] as any[];
	}, [graphSpec, mathSpec]);

	const layout = useMemo(() => {
		const cam = cameraState;
		const sceneCamera = cam
			? {
				eye: { x: cam.position[0], y: cam.position[1], z: cam.position[2] },
			}
			: undefined;
		return {
			width,
			height,
			margin: { l: 0, r: 0, t: 0, b: 0 },
			scene: {
				camera: sceneCamera,
				xaxis: { zeroline: false, showgrid: true, gridcolor: "#e5e7eb" },
				yaxis: { zeroline: false, showgrid: true, gridcolor: "#e5e7eb" },
				zaxis: { zeroline: false, showgrid: true, gridcolor: "#e5e7eb" },
			},
			paper_bgcolor: "rgba(0,0,0,0)",
			plot_bgcolor: "rgba(0,0,0,0)",
		} as any;
	}, [width, height, cameraState]);

	useEffect(() => {
		let destroyed = false;
		(async () => {
			try {
				const Plotly = (await import("plotly.js-dist-min")).default || (await import("plotly.js-dist-min"));
				if (destroyed) return;
				plotlyRef.current = Plotly;
				setPlotlyAvailable(true);
				if (!containerRef.current) return;
				await Plotly.newPlot(containerRef.current, traces, layout, { displayModeBar: false, responsive: true });
				containerRef.current.on("plotly_relayout", (ev: any) => {
					if (!onCameraChange) return;
					const sceneCam = ev?.["scene.camera"];
					if (sceneCam && sceneCam.eye) {
						onCameraChange({ position: [sceneCam.eye.x, sceneCam.eye.y, sceneCam.eye.z], rotation: [0, 0, 0], zoom: 1 });
					}
				});
			} catch (e) {
				console.warn("Plotly not available. Falling back UI will show.", e);
				setPlotlyAvailable(false);
			}
		})();
		return () => {
			destroyed = true;
			if (containerRef.current && plotlyRef.current) {
				try { plotlyRef.current.purge(containerRef.current); } catch {}
			}
		};
	}, []);

	// Update on changes
	useEffect(() => {
		if (!plotlyRef.current || !containerRef.current || !plotlyAvailable) return;
		try {
			plotlyRef.current.react(containerRef.current, traces, layout, { displayModeBar: false, responsive: true });
		} catch {}
	}, [traces, layout, plotlyAvailable]);

	if (!plotlyAvailable) {
		return (
			<div style={{ width, height }} className="border border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100">
				<div className="text-center p-4">
					<div className="text-gray-600 text-sm">Plotly.js not installed. Run pnpm add plotly.js-dist-min.</div>
				</div>
			</div>
		);
	}

	return <div ref={containerRef} style={{ width, height }} />;
};

export default PlotlyGraph;
