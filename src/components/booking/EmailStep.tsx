import { useState } from "react";
import { Mail, ArrowRight } from "lucide-react";
import StepContainer from "./StepContainer";
import StyledInput from "./StyledInput";
import StepButton from "./StepButton";

type Props = {
  email: string;
  setEmail: (value: string) => void;
  onNext: () => void;
};

export default function EmailStep({ email, setEmail, onNext }: Props) {
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
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
}
