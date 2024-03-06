import Reviews from '@mui/icons-material/Reviews';
import { Button, Rating } from "@mui/material";
import { Link } from "react-router-dom";
import { styled } from '@mui/material/styles';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: theme.palette.mode === 'light' ? 'rgb(252, 164, 39)' : '#308fe8',
    },
  }));



export const CompactRating = (props: {
    r: AggregatedRatingDB, i: string, rateSubject: (subject: Partial<RatingDB>) => void
}) => {
    const { r, i } = props
    const avg = r.average_rating ? parseFloat('' + r.average_rating).toFixed(2) : '';
    return (
        <div key={i} style={{ display: "flex", flexDirection: "row", backgroundColor: "#ffffff", padding: '16px', margin: "1%", borderRadius: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Link to="/create-statement">
                    <Button onClick={() => { props.rateSubject(r)}} variant='contained'
                        sx={{ backgroundColor: "rgba(42,74,103,1)", borderRadius: 8 }}>
                        <Reviews />
                    </Button>
                </Link>
            </div>
            <Link to={`/?search_query=subject%20name:%20${r.subject_name}&types=Ratings`} style={{ flexGrow: 1 }} onClick={() => { 
                // TODO: fix refreshing URL query params
                setTimeout(() => window.location.reload(), 100) }} >
                <div className="statement"
                    // @ts-ignore 
                    style={{ padding: "10px", margin: "10px", width: "100%", textAlign: "left", flexGrow: 1, "a:textDecoration": 'none' }} key={i}>

                    <span>{r.subject_name}</span>
                    {r.subject_reference && (<>
                        <span style={{ marginLeft: '5px', marginRight: '5px' }}>•</span>
                        <span style={{ fontSize: "10pt", color: "rgba(80,80,80,1" }}>{r.subject_reference}</span>
                    </>)}
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center'}}>
                    <div style={{flexGrow: 1}}>
                        {[1,2,3,4,5].reverse().map((i) => {
                            return (
                                <div key={''+i} style={{ display: "flex", flexDirection: "row", justifyContent: "start", alignItems: "center" }}>
                                    <div style={{paddingRight: '6px'}}>{i}</div>
                                    <div style={{flexGrow: 1}}>
                                        {/** @ts-ignore */}
                                        <BorderLinearProgress variant="determinate" value={(r.rating_count > 0 ? ((r[`_${i}`] || 0) / r.rating_count) : 0) * 100} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{paddingLeft: '10px'}}>
                        <div style={{fontSize: '40pt', color: '#888888'}}>{avg}</div>
                        <Rating name="rating" defaultValue={r.average_rating ? parseFloat(r.average_rating): undefined} precision={0.25} readOnly />
                        <div>{`${r.rating_count} Ratings` }</div>
                    </div>
                </div>
                </div>
            </Link>
        </div>
    )
}
