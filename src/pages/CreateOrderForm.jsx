import { useState } from "react";
import "./CreateOrderForm.css";

export default function CreateOrderForm(){

    const currentPrice = 105;

    const [quantity, setQuantity]  = useState("")
    const [stop, setStop] = useState("")
    const [limit, setLimit] = useState("")

    const getOrderType = ()=> {
        if(!limit && !stop) return "Market"
        if(limit && !stop) return "Limit"
        if(!limit && stop) return "Stop"
        return "Stop-Limit"
    }

    const getApproxPrice = ()=>{
        if(limit) return limit
        if(stop) return stop
        return currentPrice
    }

    const handleSubmit = (e)=>{
        e.preventDefault()

        if(!quantity){
            alert("Unesi quantity")
            return
        }

        const order = {
            quantity: Number(quantity),
            type: getOrderType(),
            price: getApproxPrice()
        }

        console.log("Order:", order)
        alert("Order submitted (mock)")
    }

    return(
        <div className="order-page">
            <h1 className="order-title">
                Create Order
            </h1>

            <div className="order-card">

                <form onSubmit={handleSubmit} className="order-form">

                    <input
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e)=>setQuantity(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Limit value (optional)"
                        value={limit}
                        onChange={(e)=>setLimit(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Stop value (optional)"
                        value={stop}
                        onChange={(e)=>setStop(e.target.value)}
                    />

                    <div className="order-info">
                        <div>
                            <span>Order Type</span>
                            <strong>{getOrderType()}</strong>
                        </div>

                        <div>
                            <span>Approx Price</span>
                            <strong>{getApproxPrice()} $</strong>
                        </div>
                    </div>

                    <button className="order-submit">
                        Submit Order
                    </button>

                </form>

            </div>
        </div>
    )
}