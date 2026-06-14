import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { router } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { useActionCable } from "@/hooks/useActionCable";

interface TicketNode {
  id: number;
  title: string;
  priority: string;
  status: string;
  category: string;
  department_id: number | null;
  department_name?: string;
  alerting?: boolean;       // semantic cluster alert (ticket_cluster)
  anomaly?: boolean;        // volumetric anomaly alert (department_surge)
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface AnomalyAlert {
  alert_id: number;
  title: string;
  description: string;
  severity: string;
  department_id: number;
  department_name: string;
  zscore: number;
}

interface Props {
  tickets: TicketNode[];
  pattern_alert_department_ids: number[];
  anomaly_alert_department_ids: number[];
}

const PRIORITY_COLOR: Record<string, string> = {
  low:      "#64748b",
  medium:   "#f59e0b",
  high:     "#f97316",
  critical: "#dc2626",
};

const PRIORITY_RADIUS: Record<string, number> = {
  critical: 24,
  high:     18,
  medium:   14,
  low:      10,
};

const PULSE_STYLE = `
  @keyframes pulse-ring {
    0%   { r: 24; opacity: 0.8; }
    70%  { r: 36; opacity: 0;   }
    100% { r: 36; opacity: 0;   }
  }
  @keyframes anomaly-ring {
    0%   { r: 28; opacity: 0.9; }
    70%  { r: 44; opacity: 0;   }
    100% { r: 44; opacity: 0;   }
  }
  .alert-pulse   { animation: pulse-ring 1.4s ease-out infinite; }
  .anomaly-pulse { animation: anomaly-ring 1.0s ease-out infinite; }
`;

interface Tooltip { x: number; y: number; node: TicketNode }

export default function OperationalTwin({
  tickets,
  pattern_alert_department_ids,
  anomaly_alert_department_ids,
}: Props) {
  const svgRef        = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<TicketNode, undefined> | null>(null);

  const [nodes, setNodes] = useState<TicketNode[]>(
    tickets.map((tkt) => ({
      ...tkt,
      alerting: pattern_alert_department_ids.includes(tkt.department_id ?? -1),
      anomaly:  anomaly_alert_department_ids.includes(tkt.department_id ?? -1),
    }))
  );
  const [tooltip, setTooltip]           = useState<Tooltip | null>(null);
  const [liveAnomalies, setLiveAnomalies] = useState<AnomalyAlert[]>([]);

  const addNode = useCallback((data: Record<string, unknown>) => {
    const ticketId = data.ticket_id as number;
    setNodes((prev) => {
      if (prev.find((n) => n.id === ticketId)) return prev;
      return [
        ...prev,
        {
          id:            ticketId,
          title:         data.title as string,
          priority:      data.priority as string,
          status:        data.status as string,
          category:      data.category as string,
          department_id: data.department_id as number | null,
          department_name: data.department_name as string | undefined,
          alerting:      pattern_alert_department_ids.includes((data.department_id as number) ?? -1),
          anomaly:       anomaly_alert_department_ids.includes((data.department_id as number) ?? -1),
        },
      ];
    });
  }, [pattern_alert_department_ids, anomaly_alert_department_ids]);

  const removeNode = useCallback((ticketId: number) => {
    setNodes((prev) => prev.filter((n) => n.id !== ticketId));
  }, []);

  const handleAnomaly = useCallback((data: Record<string, unknown>) => {
    const deptId = data.department_id as number;
    // Mark all nodes in this department as anomaly
    setNodes((prev) =>
      prev.map((n) => n.department_id === deptId ? { ...n, anomaly: true } : n)
    );
    // Add to live anomaly banner
    setLiveAnomalies((prev) => {
      const exists = prev.find((a) => a.alert_id === (data.alert_id as number));
      if (exists) return prev;
      return [
        ...prev,
        {
          alert_id:        data.alert_id as number,
          title:           data.title as string,
          description:     data.description as string,
          severity:        data.severity as string,
          department_id:   deptId,
          department_name: data.department_name as string,
          zscore:          data.zscore as number,
        },
      ];
    });
  }, []);

  useActionCable(
    { channel: "OperationalTwinChannel" },
    (data) => {
      if (data.event === "ticket_added")    addNode(data);
      if (data.event === "ticket_resolved") removeNode(data.ticket_id as number);
      if (data.type  === "anomaly_detected") handleAnomaly(data);
    }
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const width  = svgRef.current.clientWidth  || 800;
    const height = svgRef.current.clientHeight || 500;
    const svg    = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (nodes.length === 0) return;

    svg.append("defs").append("style").text(PULSE_STYLE);

    const deptIds   = [...new Set(nodes.map((n) => n.department_id ?? 0))];
    const deptCount = Math.max(deptIds.length, 1);
    const deptX     = Object.fromEntries(
      deptIds.map((did, idx) => [did, (width / (deptCount + 1)) * (idx + 1)])
    );

    const simulation = d3
      .forceSimulation<TicketNode>(nodes)
      .force("charge",    d3.forceManyBody().strength(-280))
      .force("center",    d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<TicketNode>((n) => (PRIORITY_RADIUS[n.priority] ?? 14) + 6))
      .force("clusterX",  d3.forceX<TicketNode>().x((n) => deptX[n.department_id ?? 0] ?? width / 2).strength(0.18))
      .force("clusterY",  d3.forceY<TicketNode>().y(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Department labels
    const labelLayer = svg.append("g");
    deptIds.forEach((did) => {
      const firstNode = nodes.find((n) => (n.department_id ?? 0) === did);
      const label     = firstNode?.department_name ?? `Dept ${did}`;
      const isAnomaly = nodes.some((n) => n.department_id === did && n.anomaly);

      labelLayer
        .append("text")
        .attr("x", deptX[did] ?? width / 2)
        .attr("y", 24)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("font-weight", "600")
        .attr("fill", isAnomaly ? "#7c3aed" : "#94a3b8")
        .attr("letter-spacing", "0.05em")
        .text(isAnomaly ? `⚡ ${label.toUpperCase()}` : label.toUpperCase());
    });

    const nodeGroup = svg
      .append("g")
      .selectAll<SVGGElement, TicketNode>("g")
      .data(nodes, (n) => String(n.id))
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (_evt, n) => router.visit(`/tickets/${n.id}`))
      .on("mouseenter", (evt, n) => {
        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({ x: evt.clientX - rect.left, y: evt.clientY - rect.top, node: n });
      })
      .on("mouseleave", () => setTooltip(null))
      .call(
        d3.drag<SVGGElement, TicketNode>()
          .on("start", (evt, n) => { if (!evt.active) simulation.alphaTarget(0.3).restart(); n.fx = n.x; n.fy = n.y; })
          .on("drag",  (evt, n) => { n.fx = evt.x; n.fy = evt.y; })
          .on("end",   (evt, n) => { if (!evt.active) simulation.alphaTarget(0); n.fx = null; n.fy = null; })
      );

    // Anomaly pulse ring — purple, faster, larger (department_surge)
    nodeGroup
      .filter((n) => !!n.anomaly)
      .append("circle")
      .attr("class", "anomaly-pulse")
      .attr("r", PRIORITY_RADIUS.critical + 4)
      .attr("fill", "none")
      .attr("stroke", "#7c3aed")
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.8);

    // Semantic alert pulse ring — red, slower (ticket_cluster)
    nodeGroup
      .filter((n) => !!n.alerting && !n.anomaly)
      .append("circle")
      .attr("class", "alert-pulse")
      .attr("r", PRIORITY_RADIUS.critical)
      .attr("fill", "none")
      .attr("stroke", "#dc2626")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);

    // Main circle
    nodeGroup
      .append("circle")
      .attr("r", (n) => PRIORITY_RADIUS[n.priority] ?? 14)
      .attr("fill", (n) => PRIORITY_COLOR[n.priority] ?? "#64748b")
      .attr("fill-opacity", 0.88)
      .attr("stroke", (n) => {
        if (n.anomaly)  return "#7c3aed";
        if (n.alerting) return "#dc2626";
        return "white";
      })
      .attr("stroke-width", (n) => (n.anomaly || n.alerting ? 3 : 1.5));

    // Priority initial
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", (n) => `${Math.max(8, (PRIORITY_RADIUS[n.priority] ?? 14) * 0.5)}px`)
      .attr("fill", "white")
      .attr("font-weight", "700")
      .attr("pointer-events", "none")
      .text((n) => n.priority[0].toUpperCase());

    simulation.on("tick", () => {
      nodeGroup.attr("transform", (n) => `translate(${n.x ?? 0},${n.y ?? 0})`);
    });

    return () => { simulation.stop(); };
  }, [nodes]);

  const alertingNodes = nodes.filter((n) => n.alerting && !n.anomaly);
  const anomalyNodes  = nodes.filter((n) => n.anomaly);
  const criticalNodes = nodes.filter((n) => n.priority === "critical");

  const severityColor: Record<string, string> = {
    critical: "#dc2626", high: "#f97316", medium: "#eab308", low: "#64748b"
  };

  return (
    <AppLayout title="Operational Twin">
      <div className="p-6 max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Operational Twin</h1>
            <p className="text-slate-500 mt-1">
              Live force-directed graph — {nodes.length} active ticket{nodes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(PRIORITY_COLOR).map(([priority, color]) => (
              <div key={priority} className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: `${(PRIORITY_RADIUS[priority] ?? 14) * 1.2}px`, height: `${(PRIORITY_RADIUS[priority] ?? 14) * 1.2}px`, backgroundColor: color }} />
                <span className="text-xs text-slate-500 capitalize">{priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend: alert types */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-red-500" />
            <span className="text-xs text-slate-500">Semantic cluster alert</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-purple-600" />
            <span className="text-xs text-slate-500">Volumetric anomaly (Z-score)</span>
          </div>
        </div>

        {/* Live anomaly banners */}
        <AnimatePresence>
          {liveAnomalies.map((anomaly) => (
            <motion.div
              key={anomaly.alert_id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 bg-purple-50 border border-purple-200 rounded-xl px-5 py-3 flex items-center gap-3"
            >
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.0 }}
                className="text-purple-600 text-xl"
              >
                ⚡
              </motion.span>
              <div className="flex-1">
                <p className="text-purple-800 font-semibold text-sm">{anomaly.title}</p>
                <p className="text-purple-600 text-xs mt-0.5">{anomaly.description}</p>
              </div>
              <span style={{ background: severityColor[anomaly.severity] ?? "#64748b" }}
                className="text-white text-xs font-bold px-2 py-1 rounded-full uppercase">
                {anomaly.severity}
              </span>
              <span className="text-purple-400 text-xs">Z={anomaly.zscore?.toFixed(1)}σ</span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Semantic alert banner */}
        <AnimatePresence>
          {alertingNodes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-3"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-red-500 text-xl"
              >
                ⚠️
              </motion.span>
              <div>
                <p className="text-red-700 font-semibold text-sm">
                  Semantic Pattern Alert — {alertingNodes.length} ticket{alertingNodes.length !== 1 ? "s" : ""} in affected cluster
                </p>
                <p className="text-red-500 text-xs">Nodes pulsing in red indicate similar ticket clusters.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          {[
            { label: "Active Tickets",    value: nodes.length,          color: "text-slate-800" },
            { label: "Critical",          value: criticalNodes.length,   color: "text-red-600"   },
            { label: "Semantic Alerts",   value: alertingNodes.length,   color: "text-red-500"   },
            { label: "Anomaly Alerts",    value: anomalyNodes.length,    color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* D3 Canvas */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: 520, position: "relative" }}>
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-medium">No active tickets</p>
              <p className="text-sm mt-1">All caught up — the workspace is clear.</p>
            </div>
          ) : (
            <>
              <svg ref={svgRef} className="w-full h-full" style={{ background: "transparent" }} />
              {tooltip && (
                <div style={{
                  position: "absolute", left: tooltip.x + 12, top: tooltip.y - 12,
                  pointerEvents: "none", zIndex: 50, background: "#0f172a", color: "white",
                  borderRadius: "8px", padding: "8px 12px", fontSize: "12px",
                  maxWidth: "220px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)", lineHeight: "1.5",
                }}>
                  <p className="font-semibold truncate">#{tooltip.node.id} {tooltip.node.title}</p>
                  <p style={{ color: PRIORITY_COLOR[tooltip.node.priority] ?? "#94a3b8", marginTop: 2 }}>
                    {tooltip.node.priority.toUpperCase()} · {tooltip.node.category}
                  </p>
                  {tooltip.node.anomaly  && <p style={{ color: "#a78bfa", marginTop: 2 }}>⚡ Volumetric anomaly</p>}
                  {tooltip.node.alerting && !tooltip.node.anomaly && <p style={{ color: "#f87171", marginTop: 2 }}>⚠️ Semantic cluster</p>}
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3 text-center">
          Click any node to open the ticket · Drag to rearrange · Updates in real-time via ActionCable
        </p>
      </div>
    </AppLayout>
  );
}