import { createContext, useContext, useEffect, useState } from "react";
import { server_list } from "./config/config";
const AppContext = createContext();

export function AppWrapper({ children }) {
	const [activeIdx, setActiveIdx] = useState(0);
	const [list, setList] = useState([]);
	const [wss, setWss]=useState([]);

	const [taskStatus,setTaskStatus]=useState([])////[taskid][server]
	useEffect(() => {
		setWss(state=>{
			let wss=new Array();
			server_list.map((serverUrl,key)=>{
				if(!wss[key])
				wss[key]=new WebSocket(serverUrl.wss);
			})
			return [...wss];
		})
		console.log(window.localStorage.getItem('task-list'))
		const items = JSON.parse(window.localStorage.getItem('task-list'));
		if (items) {
			setList(items);
			
		}
	
	}, []);
	useEffect(()=>{
		if(wss.length>0){
		
			let status=taskStatus;
			list.map((item,tid)=>{
				if(status[tid]==undefined)
				status[tid]=[];
				wss.map((ws,wid)=>{
					if(!status[tid].length)
					status[tid][wid]=1
					ws.addEventListener('open',()=>{
						console.log(taskStatus,"taskStatus")
						ws.send(JSON.stringify({path:"status",idx:tid}))
					})
					
				})
				
			})
			setTaskStatus(status)
		}
	},[wss,list])
	
	const AddNewTask = (taskName) => {
		console.log("add")
		let temp = {
			taskType: "custom",
			watch_functions: {
				start_hash: "0x",
				from: ""
			},
			gas: {
				type: 0,
				gasPrice: "",
				maxPriorityFeePerGas: "",
				maxFeePerGas: "",
				gasLimit: ""
			},
			bloxRouteAuthHeader: "",
			timestamp: "",
			blockDelay: 0,
			taskName
		};

		let items = JSON.parse(window.localStorage.getItem('task-list'));

		if (items) {
			items.push(temp);
		} else items = [temp];
		window.localStorage.setItem('task-list', JSON.stringify(items));
		setList([ ...list, temp]);
	}

	const updateTaks = (data) => {
		const _list = JSON.parse(window.localStorage.getItem('task-list'));
		
		
		_list[activeIdx] = {
			..._list[activeIdx], ...data
		};
		
		

		window.localStorage.setItem('task-list', JSON.stringify(_list));
		setList(_list);
	}

	const removeTask = (idx) => {
		let _list = [...list];
		if (_list.length > 1) _list.splice(idx, 1);
		else _list = [];
		window.localStorage.setItem('task-list', JSON.stringify(_list));
		setList(_list);
		// setList(list=>list.splice(idx,1))
		if (idx == activeIdx || activeIdx > idx) setActiveIdx(0);
	}
	
	const context = {
		activeIdx,wss, setActiveIdx, list, setList, AddNewTask, updateTaks, removeTask,taskStatus,setTaskStatus
	}

	return (
		<AppContext.Provider value={context}>
			{children}
		</AppContext.Provider>
	)
}

export function useAppContext() {
	return useContext(AppContext);
}