export default function HistorySummary({text}:{text:string}) {
 const paragraphs=text.trim().split(/\n\s*\n/).filter(Boolean);
 return <div className="history-summary">{paragraphs.map((paragraph,index)=>{
  // Short period labels stay editable in the existing plain-text history form.
  const period=paragraph.match(/^([^:\n]{1,40}):\s+([\s\S]+)$/);
  return period
   ? <div className="history-period" key={index}><h3>{period[1]}</h3><p>{period[2]}</p></div>
   : <p key={index}>{paragraph}</p>;
 })}</div>;
}
