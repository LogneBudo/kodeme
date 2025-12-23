import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import StepIndicator from "../components/booking/StepIndicator";
import TimeframeStep from "../components/booking/TimeframeStep";
import SlotSelectionStep from "../components/booking/SlotSelectionStep";
import SuccessScreen from "../components/booking/SuccessScreen";
import EmailStep from "../components/booking/EmailStep";
import LocationStep from "../components/booking/LocationStep";
import { updateTimeSlot, createAppointment as createFirebaseAppointment } from "../api/firebaseApi";
// import { sendBookingConfirmation } from "../api/emailApi"; // Disabled
import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";

const steps = ["Email", "Location", "Timeframe", "Select Slot"];

export default function BookAppointment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Appointment["location_type"]>("zoom");
  const [locationDetails, setLocationDetails] = useState("");
  // Default to "asap" so users see the next 30 days of slots immediately
  const [timeframe, setTimeframe] = useState("asap");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // ---------------------------------------------------------
  // Use Firebase API for appointment creation
  // ---------------------------------------------------------

  const handleBook = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);

    try {
      const appointment = await createFirebaseAppointment({
        email,
        slotId: selectedSlot.id,
        locationDetails: {
          type: selectedLocation,
          details: selectedLocation === "other" ? locationDetails : undefined,
        },
        status: "confirmed",
        appointmentDate: selectedSlot.date,
      });

      console.log("Appointment created:", appointment);
      console.log("Marking slot as booked:", selectedSlot.id);

      // Mark the slot as booked
      const updatedSlot = await updateTimeSlot(selectedSlot.id, { status: "booked" });
      console.log("Slot updated:", updatedSlot);

      // Send confirmation email with ICS attachment
      console.log("Sending confirmation email...");
      const emailSent = await sendBookingConfirmation(appointment);
      if (emailSent) {
        console.log("Email sent successfully!");
      } else {
        console.error("Failed to send email");
      }

      setBookedAppointment(appointment);
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setEmail("");
    setSelectedLocation("other");
    setLocationDetails("");
    setTimeframe("");
    setSelectedSlot(null);
    setBookedAppointment(null);
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 100 : -100, opacity: 0 }),
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0f0", padding: "40px 0" }}>
      <div style={{ width: "100%", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
            Book an Appointment
          </h1>
          <p style={{ color: "#666" }}>Schedule your visit in just a few steps</p>
        </div>

        {!bookedAppointment && (
          <StepIndicator currentStep={currentStep} steps={steps} />
        )}

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            marginTop: "20px",
            margin: "20px auto 0",
            maxWidth: "600px",
            boxSizing: "border-box",
          }}
        >
          <AnimatePresence mode="wait" custom={currentStep}>
            {bookedAppointment ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SuccessScreen appointment={bookedAppointment} onReset={handleReset} />
              </motion.div>
            ) : currentStep === 1 ? (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <EmailStep
                  email={email}
                  setEmail={setEmail}
                  onNext={() => setCurrentStep(2)}
                />
              </motion.div>
            ) : currentStep === 2 ? (
              <motion.div
                key="step2"
                custom={2}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <LocationStep
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                  locationDetails={locationDetails}
                  setLocationDetails={setLocationDetails}
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              </motion.div>
            ) : currentStep === 3 ? (
              <motion.div
                key="step3"
                custom={3}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <TimeframeStep
                  selectedTimeframe={timeframe}
                  setSelectedTimeframe={setTimeframe}
                  onNext={() => setCurrentStep(4)}
                  onBack={() => setCurrentStep(2)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="step4"
                custom={4}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <SlotSelectionStep
                  timeframe={timeframe}
                  selectedSlot={selectedSlot}
                  setSelectedSlot={setSelectedSlot}
                  onBook={handleBook}
                  onBack={() => setCurrentStep(3)}
                  isBooking={isBooking}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

