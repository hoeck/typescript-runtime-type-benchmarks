import { useState } from "react";
import * as vega from "vega";
import * as vegaLite from "vega-lite";
import { type Result, BENCHMARKS, COLORS, useDatabase } from "../database";

async function graph({
  results,
  sortedNames,
  colors,
  runtimeCount,
}: {
  // the benchmark results to display
  results: Result[];
  // module names in the order that they should appear in the graph
  sortedNames: string[];
  // the number of selected runtimes to calculate the chart bar height
  runtimeCount: number;
  // a color map so that each benchmark has the same color in different
  // node-versions
  colors: string[];
}) {
  const values = results.map((r) => ({
    ...r,
    opsLabel: r.ops.toLocaleString("en-US"),
    // artificical benchmark name to make sure its always sorted by
    // benchmark and node-version
    benchmark: [
      BENCHMARKS.find((b) => b.name === r.benchmark)?.order,
      r.runtime,
      r.runtimeVersion,
      r.benchmark,
    ].join("-"),
  }));

  const vegaSpec = vegaLite.compile({
    data: {
      values: values,
    },
    height: { step: 15 / runtimeCount },
    background: "transparent", // no white graphs for dark mode users
    facet: {
      row: {
        field: "name",
        title: null,
        header: {
          labelAngle: 0,
          labelOrient: "left",
          labelAnchor: "middle",
          labelAlign: "left",
          labelFontSize: 12,
        },
        sort: sortedNames,
      },
    },
    spec: {
      layer: [
        {
          mark: "bar",
          width: 600,
        },
        {
          mark: {
            type: "text",
            align: "left",
            baseline: "middle",
            dx: 3,
          },
          encoding: {
            text: { field: "opsLabel" },
          },
        },
      ],
      encoding: {
        x: {
          field: "ops",
          type: "quantitative",
          title: ["operations / sec", "(better ▶)"],
          axis: {
            orient: "top",
            offset: 10,
            labelFontSize: 12,
            titleFontSize: 14,
            titleFontWeight: "normal",
          },
        },
        y: {
          field: "benchmark",
          type: "nominal",
          title: "Benchmark",
          axis: null, // to debug the bars: axis: {labelFontSize: 3},
        },
        color: {
          field: "benchmark",
          type: "nominal",
          legend: null,
          scale: {
            range: colors,
          },
        },
      },
    },
  });

  const view = new vega.View(vega.parse(vegaSpec.spec), { renderer: "none" });
  const svg = await view.toSVG();

  return svg;
}

export function Graph() {
  const [svg, setSvg] = useState<string | null>(null);

  useDatabase(async (db) => {
    // delay the (expensive) graph rendering for 1 frame in order to not block
    // updating other parts of the ui
    await new Promise((resolve) => setTimeout(resolve, 16));

    setSvg(
      await graph({
        colors: COLORS,
        results: await db.findResults(),
        runtimeCount: await db.getSelectedRuntimeCount(),
        sortedNames: await db.findSortedModuleNames(),
      }),
    );
  });

  if (!svg) {
    return (
      <div style={{ margin: "5rem" }}>
        <i>No Benchmark Selected</i>
      </div>
    );
  }

  return (
    <div
      style={{ marginBottom: "1rem" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
