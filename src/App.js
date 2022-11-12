
import 'antd/dist/antd.css';
import './css/App.css';

import BalanceHistory from "./BalanceHistory"
function App() {

	return (
	<div className="page-layout">
		<div className=' bg-dark2 p-1 pt-3  pl-4 shadow d-flex '>
			<h4 className='center'><img src='/logo192.png' width={70} ></img>PNL History</h4>
		</div>
		<main>
			<div className="container">
			<BalanceHistory/>
			</div>
		</main>
	</div>
  );
}

export default App;
