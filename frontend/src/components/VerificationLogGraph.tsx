import React, { useEffect, useState } from "react";

import { LineChart } from "@mui/x-charts";
import { getVerificationLog } from "../api";
import { TextField } from "@mui/material";

type Props = {
  lt850px: boolean;
  hash: string;
};

const getMonday = (d: Date) => {
  d = new Date(d);
  d.setHours(0, 0, 0, 0);
  //return d
  let day = d.getDay();
  let diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeeklyTimeSeries = (data: {
  result: VerificationLogDB[];
}): vLogWeekly[] => {
  const withWeeks: (VerificationLogDB & { w: string })[] = data.result.map(
    (i) => ({ ...i, w: getMonday(new Date(i.t)).toString() }),
  );
  const weekly: { [key: string]: vLogWeeklyFields } = withWeeks.reduce(
    (
      acc: { [key: string]: vLogWeeklyFields },
      i: VerificationLogDB & { w: string },
    ) => {
      const _i = {
        ...i,
        api: i.api ? 1 : 0,
        dns: i.dns ? 1 : 0,
        txt: i.txt ? 1 : 0,
      };
      if (!acc[_i.w]) {
        acc[i.w] = { api: _i.api, dns: _i.dns, txt: _i.txt, count: 1 };
      } else {
        acc[_i.w]["api"] += _i.api;
        acc[_i.w]["dns"] += _i.dns;
        acc[_i.w]["txt"] += _i.txt;
        acc[_i.w]["count"] += 1;
      }
      return acc;
    },
    {} as { [key: string]: vLogWeeklyFields },
  );
  const weeklySeries = Object.keys(weekly).map((i) => ({
    ...weekly[i],
    t: new Date(i),
  }));
  return weeklySeries;
};

type vLogWeeklyFields = {
  api: number;
  dns: number;
  txt: number;
  count: number;
};

type vLogWeekly = {
  api: number;
  dns: number;
  txt: number;
  count: number;
  t: Date;
};

const valueFormatter = (date: Date) =>
  date.getHours() === 0
    ? date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
      })
    : date.toLocaleTimeString("en-US", {
        hour: "2-digit",
      });

const VerificationLogGraph = (props: Props) => {
  const [data, setData] = useState([] as vLogWeekly[]);
  const [nodeHostName, setNodeHostName] = useState(
    window.location.hostname.includes("rixdata.net")
      ? "stated.gritapp.info"
      : "stated.rixdata.net",
  );

  useEffect(() => {
    getVerificationLog(
      props.hash,
      (data) => {
        data && setData(getWeeklyTimeSeries(data));
      },
      () => {
        return;
      },
      `https://${nodeHostName}`,
    );
  }, [props.hash, nodeHostName]);

  return (
    <>
      <h3>Statement Verification Log</h3>
      <div>
        <TextField
          label="Monitoring node hostname"
          value={nodeHostName}
          onChange={(e) => setNodeHostName(e.target.value)}
        />
        {!(data && data[0]) ? (
          <div style={{ padding: "24px" }}>no verification log data</div>
        ) : (
          <div
            style={{
              padding: "24px",
              ...(props.lt850px
                ? { paddingLeft: "0px", paddingRight: "0px" }
                : {}),
            }}
          >
            <LineChart
              xAxis={[
                {
                  data: data.map((i) => new Date(i.t)).slice(0, 120),
                  scaleType: "time",
                  label: "Time",
                  valueFormatter,
                },
              ]}
              series={[
                {
                  data: data.map((i) => i.api / i.count).slice(0, 120),
                  label: "Stated API verification success rate",
                  showMark: false,
                },
                {
                  data: data.map((i) => i.dns / i.count).slice(0, 120),
                  label: "DNS TXT verification success rate",
                  showMark: false,
                },
                {
                  data: data.map((i) => i.txt / i.count).slice(0, 120),
                  label: "Text file verification success rate",
                  showMark: false,
                },
              ]}
              tooltip={{ trigger: "axis" }}
              width={props.lt850px ? 0.8 * window.screen.width : 500}
              height={300}
              legend={{
                direction: "column",
                position: {
                  vertical: "top",
                  horizontal: "middle",
                },
              }}
              sx={{
                "--ChartsLegend-rootOffsetX": "-80px",
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default VerificationLogGraph;
