import React, { Component } from 'react';
import './App.css';

import axios from 'axios';
import { BallTriangle } from 'react-loader-spinner'

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      result: [],
      isLoading: true,
      ws_result: {}
    }
  }

  componentDidMount() {
    this.getData()
  }

  shouldComponentUpdate(prev, next) {
    if (prev.result != next.result) {
      return true
    }
    return false
  }

  getData = () => {
    const apiUrl = "https://api.delta.exchange/v2/products"

    axios.get(apiUrl).then(async (res) => {
      console.log("getData response: ", res.data.result[0])
      this.setState({ isLoading: false, result: res.data.result })

      res.data && res.data.result && res.data.result.length > 0 && await this.connectSocket()

    }).catch((error) => {
      this.setState({ isLoading: false })
      console.log("error response: ", error)
    })
  }

  connectSocket = async () => {

    const url = 'wss://production-esocket.delta.exchange';
    const channel = 'v2/ticker'

    const ws = new WebSocket(url);

    ws.onopen = () => {
      const payload = {
        "type": "subscribe",
        "payload": {
          "channels": [
            {
              "name": "v2/ticker",
              "symbols": ["BTCUSD", "BTCUSDT", "MATICUSDT", "MATICUSD"]
            }
          ]
        }
      }
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      const { result } = this.state
      const ws_data = JSON.parse(event.data)
      const data = result.map((item, index) => {
        return { ...item, mark_price: item.underlying_asset.symbol == ws_data.turnover_symbol ? ws_data.mark_price : '00.00' }
      })
      this.setState({ result: data })

      // ws_result[event.data.turnover_symbol] = event.data.mark_price
      console.log("onmessage ws_result : ", ws_data);
    };

    ws.onclose = (err) => {
      console.log("onclose :", err);
    }

    ws.onerror = (err) => {
      console.log("onerror :", err);
    }

  }

  render() {

    const { result, isLoading } = this.state

    return (
      <div className='container'>
        <p className='headerText'>Delta Exchange</p>
        <div className='header-content'>
          <div className='div-25'>
            <p>Symbol</p>
          </div>
          <div className='div-25'>
            <p>Description</p>
          </div>
          <div className='div-25'>
            <p>Underlying Asset</p>
          </div>
          <div className='div-25'>
            <p>Mark Price</p>
          </div>
        </div>
        {
          result && result.map((item, index) => {
            return (
              <div key={index} className='header-content' style={{ backgroundColor: index % 2 == 0 ? "#FFF " : "#C0C0C0C0" }}>
                <div className='div-25'>
                  <p>{item.symbol}</p>
                </div>
                <div className='div-25'>
                  <p>{item.description}</p>
                </div>
                <div className='div-25'>
                  <p>{item.underlying_asset.symbol}</p>
                </div>
                <div className='div-25'>
                  <p style={{ color: item.mark_price != undefined && item.mark_price != "00.00" ? "#4281FE" : "#FF5733" }}>{item.mark_price != undefined ? item.mark_price : '00.00'}</p>
                </div>
              </div>
            )
          })
        }
        {
          isLoading && result.length == 0 &&
          <div style={{ marginTop: 100 }}>
            <BallTriangle
              heigth="100"
              width="100"
              color="grey"
              ariaLabel="loading-indicator"

            />
          </div>
        }
        {/* <p>{JSON.stringify(result)}</p> */}
      </div>
    );
  }
}

export default App