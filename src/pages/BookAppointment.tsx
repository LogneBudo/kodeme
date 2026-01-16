import { useEffect, useState } from "react";
import zoomImg from "../assets/locations/zoom.jpg";
import premisesImg from "../assets/locations/premises.jpg";
import restaurantImg from "../assets/locations/restaurant.jpg";
import otherImg from "../assets/locations/other.jpg";
import { motion, AnimatePresence } from "framer-motion";

import StepIndicator from "../components/booking/StepIndicator";
import TimeframeStep from "../components/booking/TimeframeStep";
import SlotSelectionStep from "../components/booking/SlotSelectionStep";
import SuccessScreen from "../components/booking/SuccessScreen";
import EmailStep from "../components/booking/EmailStep";
import LocationStep from "../components/booking/LocationStep";
import { updateTimeSlot, createAppointment as createFirebaseAppointment, getSettings } from "../api/firebaseApi";
import styles from "./BookAppointment.module.css";
import bookingStyles from "../components/booking/Booking.module.css";
// 
import type { TimeSlot } from "../types/timeSlot";
import type { Appointment } from "../types/appointment";
import type { Restaurant } from "../types/restaurant";

const steps = ["Email", "Location", "Timeframe", "Confirm Slot"];

export default function BookAppointment() {
  const locationBackgrounds: Record<string, string> = {
    zoom: zoomImg,
    your_premises: premisesImg,
    restaurant: restaurantImg,
    other: otherImg,
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Appointment["locationDetails"]["type"]>("zoom");
  const [locationDetails, setLocationDetails] = useState("");
  // Default to "asap" so users see the next 30 days of slots immediately
  const [timeframe, setTimeframe] = useState("asap");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings();
        setRestaurants(settings.restaurants || []);
      } catch (err) {
        console.error("Failed to load restaurants", err);
      } finally {
        setLoadingRestaurants(false);
      }
    })();
  }, []);

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
          details: selectedLocation === "zoom" ? undefined : (locationDetails || undefined),
        },
        status: "confirmed",
        appointmentDate: selectedSlot.date,
      });



      // Mark the slot as booked
      await updateTimeSlot(selectedSlot.id, { status: "booked" });




      setBookedAppointment({ ...appointment, time: selectedSlot.time, date: selectedSlot.date });
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

  // Validation functions
  const validateEmail = (email: string) => {
    return email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateLocation = () => {
    if (!selectedLocation) return false;
    if (selectedLocation === "restaurant" && !locationDetails.trim()) return false;
    if ((selectedLocation === "other" || selectedLocation === "your_premises") && !locationDetails.trim()) return false;
    return true;
  };

  const validateTimeframe = () => {
    return timeframe.trim() !== "";
  };

  // Step transition with validation
  const goToStep2 = () => {
    if (validateEmail(email)) {
      setCurrentStep(2);
    }
  };

  const goToStep3 = () => {
    if (validateLocation()) {
      setCurrentStep(3);
    }
  };

  const goToStep4 = () => {
    if (validateTimeframe()) {
      setCurrentStep(4);
    }
  };

  return (
    <>
      {currentStep === 2 && (
        <div className={styles.background}
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%), url(${locationBackgrounds[selectedLocation]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            transition: 'background-image 0.5s ease-in-out',
          }}
        />
      )}
      <div className={styles.page}>
        <div className={styles.content}>
          {!bookedAppointment && (
            <StepIndicator currentStep={currentStep} steps={steps} />
          )}

          <div className={bookingStyles.bookingCard}>
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
                  onNext={goToStep2}
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
                  restaurants={restaurants}
                  restaurantsLoading={loadingRestaurants}
                  onNext={goToStep3}
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
                  onNext={goToStep4}
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
    </>
  );
}





