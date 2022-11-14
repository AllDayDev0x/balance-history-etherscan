import { useState, useEffect } from "react";
import { Column } from "@ant-design/plots";
import { notification } from "antd";
const initConfigData = {
    data: [],
    xField: 'date',
    yField: 'EPnl',

    minColumnWidth: 10,
    maxColumnWidth: 10,
};

const BalanceHistory = () => {
    const [month, setMonth] = useState("")
    const [dataForChartDaily, setDataForDailyChart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [PnLitem, setPnLItem] = useState("D");
    const [year, setYear] = useState("");
    const [_config, setConfig] = useState(initConfigData);
    const [Ws, setWS] = useState({});
    const [totalEthBalance, setTotalEthBalance] = useState(0);
    const [totalUSDBalance, setTotalUSDBalance] = useState(0);
    const [WsState, setWsState] = useState(false);
    const [dailyPNL, setDailyPnl] = useState(0);
    const [monthlyPNL, setMonthlyPnl] = useState(0);
    const [yearlyPNL, setYearlyPnl] = useState(0);
    const [tokenBalance, setTokenBalance] = useState({usdt:0, usdc:0, dai:0});
    useEffect(() => {
        let wss = new WebSocket(`ws://${window.location.host}`);
        setWS(wss);
        //console.log(wss)
        wss.onmessage = (e) => {
            let res = JSON.parse(e.data);
            // console.log(res, "res")
            if (res.data.error) {
                // console.log(res.data.error);
                notification.error({
                    message: "Server Error",
                    description: res.data.error
                });
                setDataForDailyChart([])
                return;
            }
            else {
                setDataForDailyChart(res.data.data);
                setTotalEthBalance(res.data.TotalEthBalance);
                setTotalUSDBalance(res.data.TotalUSDBalance);
                setPnLItem(res.PNLItem);
                setDailyPnl(res.data.dailyPNL);
                setMonthlyPnl(res.data.monthlyPNL);
                setYearlyPnl(res.data.yearlyPNL);
                setTokenBalance(res.data.tokenBalance)
            }
        }
        wss.onopen = (e) => {
            setWsState(true);
        }


        const nowDate = new Date();
        const _month = nowDate.getFullYear() + "-" + (nowDate.getMonth() + 1);

        setMonth(_month);
        setYear(nowDate.getFullYear());


    }, []);
    useEffect(() => {
        // console.log(Ws)
        if (Ws && year && WsState)
            Ws.send(JSON.stringify({ Year: year, Month: month.split("-")[1] * 1, PNLItem: PnLitem }));

    }, [PnLitem, year]);
    useEffect(() => {
        if (PnLitem == "D" && Ws && month && WsState)
            Ws.send(JSON.stringify({ Year: year, Month: month.split("-")[1] * 1, PNLItem: PnLitem }));

    }, [month, WsState]);
    useEffect(() => {
        setConfig({
            data: [...dataForChartDaily],
            xField: 'date',
            yField: 'EPnl',
            tooltip: {
                customContent: (title, data) => {
                    if (data[0]) {
                        return (<div className="">
                            <div className="pl-1 text-info">
                                *EPnL
                            </div>
                            <div className=" col pl-5 rtl">
                                {data[0].mappingData._origin.EPnl}ETH
                            </div>
                            <div className="pl-1 text-success">
                                *USDPnL
                            </div>
                            <div className=" col pl-5 rtl " >
                                {data[0].mappingData._origin.DPnl}USD
                            </div>

                        </div>)
                    }
                }
            },
            color:({date})=>{
                return dataForChartDaily.filter((item)=>{
                    return item.date == date
                })[0].EPnl*1 >=0 ?"#10a4e9":"#e93b10";
            }

        })
    }, [dataForChartDaily])
    const onChangeDate = async (e) => {
        setMonth(e.target.value);
        let _year = e.target.value.split("-")[0];
        setYear(_year);

    }

    return (
        <div className="rounded shadow p-5 bg-dark2" style={{ position: "relative" }} >
            <div className=" d-flex justify-content-center" >
                <div style={{ width: "500px" }}>
                    <h5 className="">
                        TOTAL AMOUNT :
                        &nbsp;
                        &nbsp;
                        &nbsp;
                        <span className="bg-dark">{totalEthBalance}ETH</span>
                        &nbsp;
                        &nbsp;
                        &nbsp;
                        <span className="bg-dark1">{totalUSDBalance}$</span>
                    </h5>
                </div>
                <div className="pl-3">

                    <input type="month" className=" form-control" value={month} onChange={onChangeDate} />
                </div>

            </div>
            <div className="d-flex justify-content-center pl-5">
                <div className="col">
                    Daily:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                        {dailyPNL >= 0 ? <span className="text-success">{dailyPNL} ETH</span>:<span className="text-danger">{dailyPNL} ETH</span>}
                    </span>

                </div>
                <div className="col">
                    Monthly:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                    {monthlyPNL >= 0 ? <span className="text-success">{monthlyPNL} ETH</span>:<span className="text-danger">{monthlyPNL} ETH</span>}
                    </span>

                </div>
                <div className="col">
                    yearly:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                    {yearlyPNL >= 0 ? <span className="text-success">{yearlyPNL} ETH</span>:<span className="text-danger">{yearlyPNL} ETH</span>}
                    </span>

                </div>
                <div className="col">
                    USDT:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                       {tokenBalance.usdt}
                    </span>

                </div>
                <div className="col">
                    USDC:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                       {tokenBalance.usdc}
                    </span>

                </div>
                <div className="col">
                    DAI:
                    <span className="bg-dark1 border border-dark rounded p-2 ml-3 " style={{ boxShadow: "0px 0px 5px rgba(1,1,1,0.5)" }}>
                        {tokenBalance.dai}
                    </span>

                </div>


            </div>

            <div className=" p-5" >
                <div className="p-5" style={{ filter: loading ? "blur(2px)" : "blur(0px)", height: "40vh" }} >
                    <div className="d-flex justify-content-end">

                        <div className="btn-group">
                            <button onClick={e => { setPnLItem("D") }} className={PnLitem == "D" ? " btn btn-sm btn-dark" : "btn btn-sm btn-secondary"}> Daily</button>
                            <button onClick={e => { setPnLItem("M") }} className={PnLitem == "M" ? "btn btn-sm btn-dark" : "btn btn-sm btn-secondary"}> Monthly</button>
                            <button onClick={e => { setPnLItem("Y") }} className={PnLitem == "Y" ? "btn btn-sm btn-dark" : "btn btn-sm btn-secondary"}> Yearly</button>
                        </div>
                    </div>
                    <Column {..._config} />
                </div>
            </div>


            {loading && (<span className="spinner-border  text-white" style={{ height: "5em", width: "5em", position: "relative", top: "-200px", left: "50%" }}></span>)}

        </div>
    )

}
export default BalanceHistory;