import { useState } from "react";
import React from "react";
import { Mail, ArrowRight } from "lucide-react";
import StepContainer from "./StepContainer";
import StyledInput from "./StyledInput";
import StepButton from "./StepButton";
import { validateEmail } from "../../utils/validation";

type Props = {
  email: string;
  setEmail: (value: string) => void;
  onNext: () => void;
};

const EmailStep = React.memo(function EmailStep({ email, setEmail, onNext }: Props) {
  const [error, setError] = useState("");

  const handleNext = () => {
    const validation = validateEmail(email);
    
    if (!validation.isValid) {
      setError(validation.error || "Invalid email");
      return;
    }
    
    setError("");
    onNext();
  };

  return (
    <StepContainer
      icon={Mail}
      title="Enter your email"
      subtitle="We'll send the appointment confirmation to this address"
    >
      {/* Input + Button */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <StyledInput
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
          error={error}
        />

        <StepButton onClick={handleNext} icon={<ArrowRight size={16} />}>
          Continue
        </StepButton>
      </div>
    </StepContainer>
  );
});

export default EmailStep;
