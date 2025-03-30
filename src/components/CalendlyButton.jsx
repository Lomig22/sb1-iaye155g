import { PopupButton } from "react-calendly";

const CalendlyButton = () => {
  return (
    <div className="App">
      <PopupButton
        url="https://calendly.com/your_scheduling_page"
        rootElement={document.getElementById("root")}
        text="Click here to schedule!"
      />
    </div>
  );
};

export default CalendlyButton;
