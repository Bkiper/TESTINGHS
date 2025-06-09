
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BookingSearchForm, locations, shuttleTypes } from './components/BookingSearchForm';
import { SearchResultsDisplay } from './components/SearchResultsDisplay';
import { BookingConfirmationScreen } from './components/BookingConfirmationScreen';
import { BookingSuccessScreen } from './components/BookingSuccessScreen';
import { SearchParams, SearchResult, BookingStep, PassengerDetails, AiTravelSuggestion } from './types';
import { GoogleGenAI } from "@google/genai";

// Access API_KEY using process.env (injected by Vite)
const API_KEY = process.env.API_KEY;

const App: React.FC = () => {
  const [searchCriteria, setSearchCriteria] = useState<SearchParams | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>('search');
  const [selectedShuttleForBooking, setSelectedShuttleForBooking] = useState<SearchResult | null>(null);
  const [passengerDetails, setPassengerDetails] = useState<PassengerDetails>({
    fullName: '',
    email: '',
    phoneNumber: '',
  });

  // AI State
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [aiInitializationError, setAiInitializationError] = useState<string | null>(null);

  const [aiDestinationSuggestions, setAiDestinationSuggestions] = useState<string[]>([]);
  const [isAiDestinationLoading, setIsAiDestinationLoading] = useState<boolean>(false);
  const [aiDestinationError, setAiDestinationError] = useState<string | null>(null);

  const [aiTravelPlan, setAiTravelPlan] = useState<AiTravelSuggestion | null>(null);
  const [isAiTravelPlanLoading, setIsAiTravelPlanLoading] = useState<boolean>(false);
  const [aiTravelPlanError, setAiTravelPlanError] = useState<string | null>(null);

  useEffect(() => {
    if (!API_KEY) {
      console.warn("API_KEY is not set in the environment. AI features will be disabled.");
      setAiInitializationError("API Key is missing. AI features are unavailable. Please ensure API_KEY is set in your environment.");
      return;
    }
    try {
      const genAI = new GoogleGenAI({ apiKey: API_KEY });
      setAi(genAI);
      setAiInitializationError(null);
    } catch (error) {
      console.error("Failed to initialize GoogleGenAI:", error);
      setAiInitializationError("Failed to initialize AI services. Please check your API key.");
    }
  }, []);


  const generateMockResults = (params: SearchParams): SearchResult[] => {
    const results: SearchResult[] = [];
    const numberOfResults = Math.floor(Math.random() * 4); 

    const fromLocation = locations.find(l => l.id === params.leavingFrom);
    const toLocation = locations.find(l => l.id === params.goingTo);
    const selectedShuttleType = shuttleTypes.find(s => s.id === params.shuttleType);

    if (!fromLocation || !toLocation || !selectedShuttleType) return [];

    for (let i = 0; i < numberOfResults; i++) {
      const departureHour = 8 + Math.floor(Math.random() * 10); 
      const departureMinutes = Math.random() < 0.5 ? '00' : '30';
      const arrivalHour = departureHour + 2 + Math.floor(Math.random() * 3); 
      const arrivalMinutes = Math.random() < 0.5 ? '00' : '30';
      
      let basePricePerSeat = (selectedShuttleType.id === 'suv' ? 800 : selectedShuttleType.id === 'muv' ? 700 : 500);
      let finalPrice = (basePricePerSeat + Math.floor(Math.random() * 100)) * params.passengers;

      if (params.bookingType === 'reserved') {
        let reservedCarBasePrice = (selectedShuttleType.id === 'suv' ? 3000 : selectedShuttleType.id === 'muv' ? 2500 : 2000);
        if (selectedShuttleType.id === 'sedan' && params.passengers > 4) reservedCarBasePrice *= 1.5;
        else if (selectedShuttleType.id === 'suv' && params.passengers > 6) reservedCarBasePrice *= 1.5; 
        else if (selectedShuttleType.id === 'muv' && params.passengers > 6) reservedCarBasePrice *= 1.5;
        finalPrice = reservedCarBasePrice + Math.floor(Math.random() * 500);
      }

      results.push({
        id: `result-${Date.now()}-${i}`,
        fromId: params.leavingFrom,
        toId: params.goingTo,
        fromName: fromLocation.name,
        toName: toLocation.name,
        shuttleTypeId: params.shuttleType,
        shuttleTypeName: selectedShuttleType.name,
        journeyDate: params.journeyDate,
        departureTime: `${String(departureHour).padStart(2, '0')}:${departureMinutes}`,
        arrivalTime: `${String(arrivalHour % 24).padStart(2, '0')}:${arrivalMinutes}`,
        price: finalPrice,
        passengers: params.passengers,
        bookingType: params.bookingType,
        returnDate: params.returnDate,
      });
    }
    return results;
  };

  const handleSearchSubmit = (params: SearchParams) => {
    setSearchCriteria(params);
    setIsLoadingResults(true);
    setSearchResults([]);
    setSelectedShuttleForBooking(null);
    setBookingStep('search'); 
    setAiDestinationSuggestions([]); 
    setAiDestinationError(null);
    setPassengerDetails({ fullName: '', email: '', phoneNumber: '' }); // Reset passenger details

    setTimeout(() => {
      const mockResults = generateMockResults(params);
      setSearchResults(mockResults);
      setIsLoadingResults(false);
    }, 1500);
  };

  const handleSelectShuttleForBooking = (shuttle: SearchResult) => {
    setSelectedShuttleForBooking(shuttle);
    setBookingStep('confirmation');
  };

  const handleConfirmBooking = async () => {
    if (selectedShuttleForBooking && passengerDetails) {
      if (!passengerDetails.fullName.trim() || !passengerDetails.email.trim() || !passengerDetails.phoneNumber.trim()) {
        alert("Please fill in all passenger details (Full Name, Email, and Phone Number).");
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(passengerDetails.email)) {
        alert("Please enter a valid email address.");
        return;
      }
      // Basic phone validation (e.g., at least 7 digits)
      const phoneRegex = /^\d{7,}$/;
      if (!phoneRegex.test(passengerDetails.phoneNumber.replace(/\s+/g, ''))) { // Remove spaces for validation
        alert("Please enter a valid phone number (at least 7 digits).");
        return;
      }

      const bookingPayload = {
        shuttleDetails: selectedShuttleForBooking,
        passengerInfo: passengerDetails,
      };
      console.log("Booking confirmed on frontend:", bookingPayload);
      
      try {
        console.log("Attempting to send booking data to backend...");
        const response = await fetch(`${window.location.origin}/api/bookings`, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingPayload),
        });

        if (!response.ok) {
          let messageDetail = "Error details not available or not in JSON format."; // Default message
          try {
            // Try to parse JSON, backend might send { message: "details" }
            const errorResponseData = await response.json();
            if (errorResponseData && errorResponseData.message && typeof errorResponseData.message === 'string') {
              messageDetail = errorResponseData.message;
            }
          } catch (e) {
            // Failed to parse JSON or no .message field.
            // Use response.statusText if it's descriptive (e.g., "Not Found", "Internal Server Error").
            if (response.statusText && response.statusText.trim() !== "") {
                messageDetail = response.statusText;
            }
            // If statusText is also empty or unhelpful, the default messageDetail will be used.
          }
          throw new Error(`Backend error: ${response.status} - ${messageDetail}`);
        }

        const responseData = await response.json(); // Assuming backend sends back a confirmation if response.ok
        console.log("Booking data successfully sent to backend:", responseData);
        
      } catch (error) {
        console.error("Failed to send booking data to backend:", error);
      }

      setBookingStep('booked');
    }
  };

  const handleStartNewSearch = () => {
    setSearchCriteria(null);
    setSearchResults([]);
    setSelectedShuttleForBooking(null);
    setPassengerDetails({ fullName: '', email: '', phoneNumber: '' });
    setBookingStep('search');
    setAiDestinationSuggestions([]);
    setAiDestinationError(null);
    setAiTravelPlan(null);
    setAiTravelPlanError(null);
  };

  const fetchAiDestinationSuggestions = async (leavingFromName: string) => {
    if (!ai || aiInitializationError) {
      setAiDestinationError(aiInitializationError || "AI service not initialized.");
      return;
    }
    setIsAiDestinationLoading(true);
    setAiDestinationError(null);
    setAiDestinationSuggestions([]);

    const prompt = `You are a helpful travel assistant for Himalayan Shuttle.
A traveler is starting their journey from "${leavingFromName}" in the Indian Himalayas.
Suggest three popular and relevant destinations they could travel to by shuttle from this starting point.
Return only the destination names, separated by commas. For example: Destination One, Destination Two, Destination Three.
Do not include the starting location in the suggestions. Ensure suggestions are distinct and suitable for shuttle travel in that region.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
      });
      const text = response.text;
      const suggestions = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
      setAiDestinationSuggestions(suggestions.slice(0, 3)); 
    } catch (error) {
      console.error("Error fetching AI destination suggestions:", error);
      setAiDestinationError("Sorry, couldn't fetch AI suggestions at the moment.");
      setAiDestinationSuggestions([]);
    } finally {
      setIsAiDestinationLoading(false);
    }
  };
  
  const handleAiSuggestionSelected = (suggestedDestinationName: string) => {
    // This function could be expanded, e.g., to show a modal if it's a truly new destination
    // For now, we just log it or potentially try to find it if it was added to locations
    console.log("AI Destination suggestion selected in form:", suggestedDestinationName);
    // If you want to set it in the "Going To" field and it's a known location ID:
    // const matchedLocation = locations.find(loc => loc.name.toLowerCase() === suggestedDestinationName.toLowerCase());
    // if (matchedLocation) {
    //   setGoingTo(matchedLocation.id); // Assuming 'goingTo' and 'setGoingTo' are accessible here or passed down
    // }
  };


  const fetchAiTravelPlan = async (bookedShuttle: SearchResult) => {
    if (!ai || aiInitializationError) {
        setAiTravelPlanError(aiInitializationError || "AI service not initialized.");
        return;
    }
    setIsAiTravelPlanLoading(true);
    setAiTravelPlanError(null);
    setAiTravelPlan(null);

    const prompt = `You are a Himalayan travel expert. A user has just booked a shuttle:
From: ${bookedShuttle.fromName}
To: ${bookedShuttle.toName}
Date: ${bookedShuttle.journeyDate}
Shuttle Type: ${bookedShuttle.shuttleTypeName}
Booking Type: ${bookedShuttle.bookingType}

Suggest 2-3 interesting things to do or see in or around the destination "${bookedShuttle.toName}", considering they are arriving by shuttle.
Focus on activities that are reasonably accessible. Keep the suggestions concise and inspiring.
Example: "Explore the local market near ${bookedShuttle.toName} for unique handicrafts. Or, consider a short trek to a nearby viewpoint for stunning vistas."`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
        });
        setAiTravelPlan({ text: response.text });
    } catch (error) {
        console.error("Error fetching AI travel plan:", error);
        setAiTravelPlanError("Sorry, couldn't fetch AI travel ideas right now.");
    } finally {
        setIsAiTravelPlanLoading(false);
    }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-rose-50 to-sky-100 flex flex-col items-center p-4 ">
      <Header />
      <main className="flex-grow w-full flex flex-col items-center justify-center py-8 md:py-12">
        {bookingStep === 'search' && (
          <>
            <BookingSearchForm 
                onSearchSubmit={handleSearchSubmit} 
                onFetchAiDestinationSuggestions={fetchAiDestinationSuggestions}
                aiDestinationSuggestions={aiDestinationSuggestions}
                isAiDestinationLoading={isAiDestinationLoading}
                aiDestinationError={aiDestinationError}
                onAiSuggestionSelected={handleAiSuggestionSelected}
            />
            {searchCriteria && !isLoadingResults && (
              <div className="mt-8 md:mt-12 w-full">
                <SearchResultsDisplay 
                  results={searchResults} 
                  isLoading={isLoadingResults} 
                  searchCriteria={searchCriteria}
                  onSelectShuttle={handleSelectShuttleForBooking}
                />
              </div>
            )}
             {isLoadingResults && (
                <div className="mt-8 md:mt-12 w-full max-w-3xl bg-white p-6 md:p-8 rounded-xl shadow-xl">
                    <SearchResultsDisplay 
                        results={[]} 
                        isLoading={true} 
                        searchCriteria={searchCriteria}
                        onSelectShuttle={handleSelectShuttleForBooking}
                    />
                </div>
            )}
          </>
        )}
        {bookingStep === 'confirmation' && selectedShuttleForBooking && (
          <BookingConfirmationScreen 
            shuttle={selectedShuttleForBooking}
            passengerDetails={passengerDetails}
            onPassengerDetailsChange={setPassengerDetails}
            onConfirmBooking={handleConfirmBooking}
            onCancel={() => setBookingStep('search')} 
          />
        )}
        {bookingStep === 'booked' && selectedShuttleForBooking && (
          <BookingSuccessScreen 
            bookedShuttle={selectedShuttleForBooking} 
            passengerDetails={passengerDetails}
            onBookAnother={handleStartNewSearch}
            onFetchAiTravelPlan={fetchAiTravelPlan}
            aiTravelPlan={aiTravelPlan}
            isAiTravelPlanLoading={isAiTravelPlanLoading}
            aiTravelPlanError={aiTravelPlanError}
          />
        )}
         {aiInitializationError && bookingStep === 'search' && !searchCriteria && (
            <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md text-center max-w-md">
                <p className="font-semibold">AI Features Disabled</p>
                <p className="text-sm">{aiInitializationError}</p>
            </div>
        )}
      </main>
      <footer className="text-center text-sm text-slate-500 py-4 w-full">
        &copy; {new Date().getFullYear()} Himalayan Shuttle Services. Adventure Awaits!
      </footer>
    </div>
  );
};

export default App;
