import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import Rooms from "./pages/Rooms";
import Book from "./pages/Book";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingLookup from "./pages/BookingLookup";
import Services from "./pages/Services";
import CarRental from "./pages/CarRental";
import FunctionHall from "./pages/FunctionHall";
import RestaurantCafe from "./pages/RestaurantCafe";
import PastEvents from "./pages/PastEvents";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Policies from "./pages/Policies";
import NotFound from "./pages/NotFound";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="services" element={<Services />} />
          <Route path="book" element={<Book />} />
          <Route path="booking-confirmation/:ref" element={<BookingConfirmation />} />
          <Route path="booking-lookup" element={<BookingLookup />} />
          <Route path="car-rental" element={<CarRental />} />
          <Route path="function-hall" element={<FunctionHall />} />
          <Route path="restaurant-cafe" element={<RestaurantCafe />} />
          <Route path="past-events" element={<PastEvents />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="policies" element={<Policies />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
