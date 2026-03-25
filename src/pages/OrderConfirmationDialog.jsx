import { useState } from "react"
import "./OrderConfirmationDialog.css"

export default function OrderConfirmationDialog(){

  const [show,setShow] = useState(false)

  const order = {
    type: "Limit",
    quantity: 10,
    price: 100
  }

  const total = order.quantity * order.price

  const confirmOrder = ()=>{
    console.log("CONFIRMED:", order)
    alert("Order confirmed (mock)")
    setShow(false)
  }

  return(
    <div className="order-page">

      <h1 className="order-title">
        Order Confirmation
      </h1>

      <button
        className="open-modal-btn"
        onClick={()=>setShow(true)}
      >
        Open Confirmation
      </button>

      {show && (
        <div className="modal-overlay">

          <div className="modal">

            <h2>Confirm Order</h2>

            <p><strong>Type:</strong> {order.type}</p>
            <p><strong>Quantity:</strong> {order.quantity}</p>
            <p><strong>Price:</strong> {order.price} $</p>
            <p><strong>Total:</strong> {total} $</p>

            <div className="modal-actions">

              <button
                className="confirm-btn"
                onClick={confirmOrder}
              >
                Confirm
              </button>

              <button
                className="cancel-btn"
                onClick={()=>setShow(false)}
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}