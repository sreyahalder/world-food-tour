/** Original pixel artwork, drawn as crisp SVG blocks for every screen size. */
export default function ExpeditionScene(){
 const trees=[[12,91,1.1],[44,109,.8],[276,100,1.3],[302,128,.9],[23,168,1.2],[283,182,1.2],[59,191,.8],[245,154,.7],[35,127,.65]];
 const buildings=[[20,40,19,49],[44,27,19,62],[69,44,14,45],[88,34,23,55],[117,18,17,71],[141,37,20,52],[169,30,17,59],[191,45,18,44],[217,35,24,54],[248,26,20,63],[277,42,19,47]];
 return <svg viewBox="0 0 320 226" role="img" aria-label="Pixel art of two diners at a table in a green New York park, beside a food stand and the city skyline" shapeRendering="crispEdges" className="expedition-scene">
 <defs>
  <pattern id="pixel-water" width="17" height="11" patternUnits="userSpaceOnUse"><rect width="17" height="11" fill="#597a94"/><path d="M2 2h4v1H2zM11 7h3v1h-3z" fill="#9bafaa" opacity=".55"/></pattern>
  <pattern id="pixel-grass" width="15" height="13" patternUnits="userSpaceOnUse"><rect width="15" height="13" fill="#72a34b"/><path d="M2 3h2v2H2zM10 10h3v1h-3zM6 8h1v2H6z" fill="#507d3b"/><path d="M11 2h1v2h-1zM4 11h2v1H4z" fill="#9cbb60"/></pattern>
  <pattern id="pixel-cobble" width="12" height="8" patternUnits="userSpaceOnUse"><rect width="12" height="8" fill="#c7c6a3"/><path d="M1 1h7v2H1zM6 5h5v2H6z" fill="#e0ddba"/><path d="M0 4h4v1H0zM9 0h1v3H9z" fill="#9b9e82"/></pattern>
  <g id="fir"><path d="M-2 4h4v16h-4z" fill="#4b4930"/><path d="M0-33h2v7h4v6h5v7h5v7h6v7h-8v4H7v4H-7V5h-8V1h-7v-7h6v-7h5v-7h5v-6h6z" fill="#284a37"/><path d="M0-29h2v7h4v6h5v7h5v5H5v5H-9v-4h-8v-3h8v-6h5v-7h4z" fill="#547e3e"/><path d="M0-27h2v9h-4v7h-4v7h-6v-2h4v-8h4v-8h4zM2-4h6v3H2zM-9 5h7v3h-7z" fill="#9aba5b"/></g>
  <g id="bush"><path d="M-10 0v-5h5v-4h9v3h5v4h3v7H-9z" fill="#315639"/><path d="M-8-3h5v-4h6v3h5v5H-8z" fill="#6d9946"/><path d="M-7-3h3v2h-3zM0-5h3v2H0z" fill="#a0b968"/></g>
 </defs>
 <rect width="320" height="226" fill="#96b4bc"/><path d="M0 14h18v-4h22v3h17v7h-8v4H0zM142 7h27v-4h27v4h15v8h-16v4h-36v-4h-17zM264 18h25v-6h20v4h11v13h-56z" fill="#d9ddc3"/>
 <path d="M0 61h320v37H0z" fill="#a9bbb0"/>
 {buildings.map(([x,y,w,h],i)=><g key={i}><rect x={x} y={y} width={w} height={h} fill={i%2?'#617b7b':'#7c9090'}/><rect x={x+2} y={y+3} width={w-5} height={h-3} fill={i%2?'#78908a':'#92a29a'}/>{Array.from({length:Math.floor(h/8)},(_,n)=><path key={n} d={`M${x+4} ${y+5+n*8}h3v3h-3zM${x+w-7} ${y+5+n*8}h3v3h-3z`} fill="#c6ccae"/>)}</g>)}
 <path d="M124 6h2v12h-2zM122 14h6v4h-6zM255 13h2v13h-2z" fill="#496366"/>
 <rect y="89" width="320" height="49" fill="url(#pixel-water)"/>
 <path d="M0 114h59v6h54v-8h56v7h44v-10h54v5h53v112H0z" fill="#3e633e"/><path d="M0 119h59v6h55v-8h55v7h44v-10h54v5h53v107H0z" fill="url(#pixel-grass)"/>
 <path d="M320 148h-51v6h-52v7h-58v9h-36v8H89v9H55v12H0v18h59v-8h33v-11h39v-11h36v-9h55v-8h48v-6h50z" fill="#536842"/>
 <path d="M320 146h-51v6h-52v7h-58v9h-36v8H89v9H55v12H0v15h57v-8h33v-11h39v-11h36v-9h55v-8h48v-6h52z" fill="url(#pixel-cobble)"/>
 <path d="M19 100h52v2H19zM25 94h2v14h-2zM65 94h2v14h-2zM30 96h30v2H30z" fill="#e3dec1"/>
 {trees.filter(t=>t[1]<140).map(([x,y,s],i)=><use href="#fir" key={i} transform={`translate(${x} ${y}) scale(${s})`}/>)}
 <path d="M78 137l17-7h69l15 8-9 5H91z" fill="#45683a"/>
 <path d="M88 107h74v37H88z" fill="#434b35"/><path d="M92 110h65v29H92z" fill="#d4ceaa"/><path d="M97 116h56v17H97z" fill="#3e5340"/><path d="M98 117h12v14H98zM114 117h17v14h-17z" fill="#829063"/>
 <path d="M83 108l8-19h65l10 19z" fill="#e4d9b1"/>
 <path d="M88 108l7-19h9l-4 19zM111 108l2-19h9v19zM135 108l-2-19h9l4 19zM157 108l-6-19h6l9 19z" fill="#9c5e43"/>
 <path d="M83 107h83v6H83z" fill="#d9cda6"/><path d="M88 108h12v6H88zM111 108h12v6h-12zM135 108h12v6h-12zM157 108h9v6h-9z" fill="#a86646"/>
 <rect x="107" y="80" width="38" height="9" fill="#3a4934"/><text x="126" y="87" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#ece4bd">EAT</text>
 <path d="M90 133h70v5H90zM94 139h4v11h-4zM153 139h4v11h-4z" fill="#655338"/><path d="M91 133h68v2H91z" fill="#b6ac7e"/>
 <path d="M100 129h5v4h-5zM110 127h5v6h-5zM143 128h8v5h-8z" fill="#e9d69c"/><path d="M111 125h3v3h-3z" fill="#ad6b40"/>
 <path d="M192 149h32v4h-32zM194 153h4v16h-4zM218 153h4v16h-4z" fill="#443e2b"/><path d="M190 146h36v7h-36z" fill="#c2ad74"/><path d="M191 146h34v2h-34z" fill="#e5d6a4"/>
 <path d="M198 147h7v3h-7zM212 147h7v3h-7z" fill="#f0e6c3"/><path d="M200 148h3v1h-3zM214 148h3v1h-3z" fill="#ac7341"/>
 <path d="M186 139h9v14h-9zM186 151h5v11h-5zM183 161h8v3h-8z" fill="#294b42"/><path d="M186 130h8v9h-8z" fill="#bd8b62"/><path d="M184 129h10v5h-10zM184 133h3v8h-3z" fill="#3a332a"/><path d="M191 142h7v3h-7z" fill="#c3946c"/>
 <path d="M225 138h9v16h-9zM230 152h4v10h-4zM230 161h9v3h-9z" fill="#a75b42"/><path d="M226 129h8v10h-8z" fill="#d4aa7b"/><path d="M226 127h9v5h-9zM232 131h3v9h-3z" fill="#564131"/><path d="M220 142h8v3h-8z" fill="#d4aa7b"/>
 <path d="M181 149h3v12h-3zM179 159h12v3h-12zM238 149h3v12h-3zM231 159h12v3h-12z" fill="#62573b"/>
 <use href="#bush" transform="translate(172 126)"/><use href="#bush" transform="translate(80 154)"/><use href="#bush" transform="translate(258 195)"/>
 {trees.filter(t=>t[1]>=140).map(([x,y,s],i)=><use href="#fir" key={i} transform={`translate(${x} ${y}) scale(${s})`}/>)}
 <path d="M110 205h3v5h-3zM107 202h3v3h-3zM113 200h3v3h-3zM254 132h2v5h-2zM252 130h2v3h-2zM258 130h2v3h-2z" fill="#d5d59a"/>
 <path d="M310 199h-10v3h10zM134 141h9v2h-9zM38 173h7v2h-7z" fill="#455a38"/>
 </svg>
}
