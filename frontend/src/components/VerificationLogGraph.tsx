import React, { useEffect, useState } from 'react'

import { LineChart } from '@mui/x-charts';
import { getVerificationLog, vLog } from '../api';
import { TextField } from '@mui/material';


type Props = {
  lt850px: boolean,
  hash: string,
}

const getMonday = (d: Date) => {
  d = new Date(d);
  d.setHours(0, 0, 0, 0);
  //return d
  let day = d.getDay()
  let diff = d.getDate() - day + (day === 0 ? - 6 : 1);
  return new Date(d.setDate(diff));
}

const getWeeklyTimeSeries = (data: { result: vLog[] }): vLogWeekly[] => {
  const withWeeks = data.result.map(i => ({ ...i, w: getMonday(new Date(i.t)) }))
  const weekly = withWeeks.reduce((acc, i) => {
    i = { ...i, api: i.api ? 1 : 0, dns: i.dns ? 1 : 0, txt: i.txt ? 1 : 0 }
    if (!acc[i.w]) {
      acc[i.w] = { api: i.api, dns: i.dns, txt: i.txt, count: 1 }
    }
    else {
      acc[i.w]['api'] += i.api
      acc[i.w]['dns'] += i.dns
      acc[i.w]['txt'] += i.txt
      acc[i.w]['count'] += 1
    }
    return acc
  }, {})
  const weeklySeries = Object.keys(weekly).map(i => ({ ...weekly[i], t: i }))
  return weeklySeries
}

type vLogWeekly = {
  api: number,
  dns: number,
  txt: number,
  count: number,
  t: Date
}

const valueFormatter = (date: Date) =>
  date.getHours() === 0
    ? date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    })
    : date.toLocaleTimeString('en-US', {
      hour: '2-digit',
    });

const VerificationLogGraph = (props: Props) => {

  const [data, setData] = useState([] as vLogWeekly[])
  const [nodeHostName, setNodeHostName] = useState(window.location.hostname.includes('rixdata.net') || true ? 'stated.gritapp.info' : 'stated.rixdata.net')

  useEffect(() => {
    getVerificationLog(props.hash, (data) => {
      data && setData(getWeeklyTimeSeries(data))
    }, () => { return }, `https://${nodeHostName}`)
  }, [props.hash, nodeHostName])

  return (
    <>
      <h3>Statement Verification Log</h3>
      <div>
        <TextField label="Monitoring node hostname" value={nodeHostName} onChange={(e) => setNodeHostName(e.target.value)} />
        {!(data && data[0]) ? (<div style={{padding: '24px'}}>no verification log data</div>)
          : (
            <div style={{padding: '24px', ...(props.lt850px ? {paddingLeft: '0px', paddingRight: '0px'}: {})}}>
                <LineChart
                  xAxis={[
                    {
                      data: data.map(i => new Date(i.t)).slice(0, 120),
                      scaleType: 'time', label: 'Time', valueFormatter
                    },
                  ]}
                  series={[
                    { data: data.map(i => i.api / i.count).slice(0, 120), label: 'Stated API verification success rate', showMark: false },
                    { data: data.map(i => i.dns / i.count).slice(0, 120), label: 'DNS TXT verification success rate', showMark: false },
                    { data: data.map(i => i.txt / i.count).slice(0, 120), label: 'Text file verification success rate', showMark: false },

                  ]}
                  tooltip={{ trigger: 'axis' }}
                  width={props.lt850px? 0.8 * window.screen.width : 500}
                  height={300}

                  legend={{
                    direction: "column",
                    position: {
                      vertical: "top",
                      horizontal: "middle"
                    }
                  }}
                  sx={{
                    "--ChartsLegend-rootOffsetX": "-80px",
                  }}
                />
              </div>
          )}
      </div>
    </>)
}

export default VerificationLogGraph
