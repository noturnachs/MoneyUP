import React, { useEffect, useState, useRef, useCallback } from "react";

const PayPalButton = ({ amount, onSuccess, onCancel, registrationData }) => {
  const [error, setError] = useState(null);
  const isProcessing = useRef(false);

  const handleSuccess = useCallback(
    (result) => {
      if (onSuccess) {
        onSuccess(result);
      }
    },
    [onSuccess]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    const container = document.getElementById("paypal-button-container");
    if (container) {
      container.innerHTML = "";
    }

    const paypalButtonsComponent = window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "pay",
      },

      createOrder: (data, actions) => {
        return actions.order.create({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "PHP",
                value: amount,
              },
              description: "Pro Plan Subscription",
            },
          ],
        });
      },

      onApprove: async (data, actions) => {
        if (isProcessing.current) {
          console.log("Payment already being processed");
          return;
        }

        try {
          isProcessing.current = true;

          // Capture the order and get the details
          const captureData = await actions.order.capture();
          console.log("Capture Data:", captureData);

          // Call handleSuccess with the capture data
          handleSuccess(captureData);
        } catch (err) {
          console.error("Payment processing error:", err);
          setError(err.message);
          handleCancel();
        } finally {
          isProcessing.current = false;
        }
      },

      onCancel: (data) => {
        console.log("Payment cancelled:", data);
        handleCancel();
      },

      onError: (err) => {
        console.error("PayPal Checkout error:", err);
        setError(err.message);
        isProcessing.current = false;
      },
    });

    paypalButtonsComponent.render("#paypal-button-container").catch((err) => {
      console.error("PayPal button render error:", err);
      setError("Failed to load PayPal button");
    });

    return () => {
      try {
        paypalButtonsComponent.close();
      } catch (err) {
        console.error("Error closing PayPal buttons:", err);
      }
    };
  }, [amount, handleSuccess, handleCancel, registrationData]);

  return (
    <div>
      <div id="paypal-button-container"></div>
      {error && (
        <div className="text-red-500 text-sm mt-2 text-center">{error}</div>
      )}
    </div>
  );
};

PayPalButton.defaultProps = {
  registrationData: null,
};

export default PayPalButton;
