import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {io} from "socket.io-client";
import "./style.css";

const API=import.meta.env.VITE_API_URL||"http://localhost:6000/api";
const SOCKET=import.meta.env.VITE_SOCKET_URL||"http://localhost:6000";
async function api(p,o={}){const r=await fetch(API+p,{...o,headers:{"Content-Type":"application/json",...(localStorage.token?{Authorization:`Bearer ${localStorage.token}`}:{})}});const d=await r.json();if(!r.ok)throw Error(d.message||"Request failed");return d}

function App(){
 const [user,setUser]=useState(()=>JSON.parse(localStorage.user||"null")),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[name,setName]=useState("");
 const [users,setUsers]=useState([]),[convs,setConvs]=useState([]),[active,setActive]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState(""),[typing,setTyping]=useState(false),socket=useRef(null);
 useEffect(()=>{if(!user)return;api("/users").then(setUsers);api("/conversations").then(setConvs);socket.current=io(SOCKET,{auth:{token:localStorage.token}});socket.current.on("message",m=>setMessages(x=>[...x,m]));socket.current.on("typing",d=>setTyping(d.typing));socket.current.on("presence",p=>setUsers(x=>x.map(u=>u._id===p.userId?{...u,online:p.online}:u)));return()=>socket.current?.disconnect()},[user]);
 async function login(e){e.preventDefault();try{const d=await api("/auth/login",{method:"POST",body:JSON.stringify({email,password})});localStorage.token=d.token;localStorage.user=JSON.stringify(d.user);setUser(d.user)}catch(e){alert(e.message)}}
 async function register(e){e.preventDefault();try{const d=await api("/auth/register",{method:"POST",body:JSON.stringify({name,email,password})});localStorage.token=d.token;localStorage.user=JSON.stringify(d.user);setUser(d.user)}catch(e){alert(e.message)}}
 async function openChat(u){const c=await api("/conversations",{method:"POST",body:JSON.stringify({userId:u._id})});setActive(c);socket.current.emit("join",c._id);setMessages(await api("/messages/"+c._id));}
 function send(e){e.preventDefault();if(!text.trim()||!active)return;socket.current.emit("message",{conversationId:active._id,text});setText("");socket.current.emit("typing",{conversationId:active._id,typing:false})}
 if(!user)return <div className="auth"><form onSubmit={login}><h1>ChatFlow</h1><input placeholder="Name (register only)" value={name} onChange={e=>setName(e.target.value)}/><input required placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/><button>Login</button><button type="button" onClick={register}>Create account</button></form></div>;
 const other=active?.members?.find(m=>String(m._id)!==String(user.id));
 return <div className="app"><aside><h2>ChatFlow</h2><p>Hi, {user.name}</p>{users.map(u=><button className="user" onClick={()=>openChat(u)} key={u._id}><span className={u.online?"dot online":"dot"}></span>{u.name}</button>)}</aside><section className="chat">{active?<><header><b>{active.isGroup?active.name:other?.name}</b><small>{other?.online?"Online":"Offline"}</small></header><div className="messages">{messages.map(m=><div className={String(m.sender._id)===String(user.id)?"bubble me":"bubble"} key={m._id}><b>{m.sender.name}</b><div>{m.text}</div><small>{new Date(m.createdAt).toLocaleTimeString()}</small></div>)}{typing&&<i>Typing…</i>}</div><form className="composer" onSubmit={send}><input value={text} onChange={e=>{setText(e.target.value);socket.current.emit("typing",{conversationId:active._id,typing:true})}} placeholder="Type a message…"/><button>Send</button></form></>:<div className="empty">Select a person to start chatting.</div>}</section></div>
}
createRoot(document.getElementById("root")).render(<App/>);
