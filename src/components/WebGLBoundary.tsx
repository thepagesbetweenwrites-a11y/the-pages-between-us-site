import { Component } from "react";
import type { ReactNode } from "react";

// If WebGL is unavailable (old GPU, blocked drivers, some VMs), keep the site
// usable: swap the 3D stage for a still, lantern-lit backdrop.
export class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[stage] WebGL unavailable, using static backdrop:", error);
  }

  render() {
    if (this.state.failed) return <div className="stage-fallback" aria-hidden />;
    return this.props.children;
  }
}

export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
