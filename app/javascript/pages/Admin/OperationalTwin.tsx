import { useEffect, useRef, useState } from "react";
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
  alerting?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Props {
  tickets: TicketNode[];
  pattern_alert_department_ids: number[];
}

const PRIORITY_COLOR: Record<string, string> = {
  low:      "#64748b",
  medium:   "#f59e0b",
  high:     "#f97316",
  critical: "#dc2626",
};

export default function OperationalTwin({ tickets, pattern_alert_department_ids }: Props) {
  const svgRef                      = useRef<SVGSVGElement>(null);
  const simulationRef               = useRef<d3.Simulation<TicketNode, undefined> | null>(null);
  const [nodes, setNodes]           = useState<TicketNode[]>(
    tickets.map((tkt) => ({
      ...tkt,
      alerting: pattern_alert_department_ids.includes(tkt.department_id ?? -1),
    }))
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ActionCable subscription
  // ActionCable subscription
  useActionCable(
    { channel: "OperationalTwinChannel" },
    (data) => {
      const event     = data.event as string;
      const ticketId  = data.ticket_id as number;

      if (event === "ticket_added") {
        setNodes((prev) => {
          if (prev.find((node) => node.id === ticketId)) return prev;
          return [
            ...prev,
            {
              id:            ticketId,
              title:         data.title as string,
              priority:      data.priority as string,
              status:        data.status as string,
              category:      data.category as string,
              department_id: data.department_id as number | null,
              alerting:      pattern_alert_department_ids.includes((data.department_id as number) ?? -1),
            },
          ];
        });
      }

      if (event === "ticket_resolved") {
        setNodes((prev) => prev.filter((node) => node.id !== ticketId));
      }
    }
  );

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current) return;

    const width  = svgRef.current.clientWidth  || 800;
    const height = svgRef.current.clientHeight || 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (nodes.length === 0) return;

    const simulation = d3
      .forceSimulation<TicketNode>(nodes)
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center",  d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(28))
      .force(
        "cluster",
        d3
          .forceX<TicketNode>()
          .x((node) => {
            const deptId = node.department_id ?? 0;
            return (width / 6) * ((deptId % 5) + 1);
          })
          .strength(0.15)
      );

    simulationRef.current = simulation;

    const nodeGroup = svg
      .append("g")
      .selectAll("g")
      .data(nodes, (node) => String((node as TicketNode).id))
      .enter()
      .append("g")
      .style("cursor", "pointer")
      .on("click", (_evt, node) => {
        setSelectedId(node.id);
        router.visit(`/tickets/${node.id}`);
      })
      .call(
        d3
          .drag<SVGGElement, TicketNode>()
          .on("start", (evt, node) => {
            if (!evt.active) simulation.alphaTarget(0.3).restart();
            node.fx = node.x;
            node.fy = node.y;
          })
          .on("drag", (evt, node) => {
            node.fx = evt.x;
            node.fy = evt.y;
          })
          .on("end", (evt, node) => {
            if (!evt.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
          })
      );

    nodeGroup
      .append("circle")
      .attr("r", 20)
      .attr("fill", (node) => PRIORITY_COLOR[node.priority] ?? "#64748b")
      .attr("fill-opacity", 0.85)
      .attr("stroke", (node) => (node.alerting ? "#dc2626" : "white"))
      .attr("stroke-width", (node) => (node.alerting ? 3 : 1.5));

    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "9px")
      .attr("fill", "white")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text((node) => node.priority[0].toUpperCase());

    nodeGroup
      .append("title")
      .text((node) => `#${node.id} ${node.title}\n${node.priority} · ${node.category}`);

    simulation.on("tick", () => {
      nodeGroup.attr("transform", (node) => `translate(${node.x ?? 0},${node.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  const alertingNodes  = nodes.filter((node) => node.alerting);
  const criticalNodes  = nodes.filter((node) => node.priority === "critical");

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
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-500 capitalize">{priority}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Alert Banner */}
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
                  Pattern Alert Active — {alertingNodes.length} ticket{alertingNodes.length !== 1 ? "s" : ""} in affected cluster
                </p>
                <p className="text-red-500 text-xs">
                  Nodes pulsing in red indicate departments with active pattern alerts.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "Active Tickets",   value: nodes.length,        color: "text-slate-800" },
            { label: "Critical",         value: criticalNodes.length, color: "text-red-600"   },
            { label: "Pattern Alerts",   value: alertingNodes.length, color: "text-amber-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* D3 Canvas */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: 520 }}>
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-medium">No active tickets</p>
              <p className="text-sm mt-1">All caught up — the workspace is clear.</p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ background: "transparent" }}
            />
          )}
        </div>

        <p className="text-xs text-slate-400 mt-3 text-center">
          Click any node to open the ticket · Drag to rearrange · Updates in real-time via ActionCable
        </p>
      </div>
    </AppLayout>
  );
}