import React from "react";
import Hero from "../components/home/Hero";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Categories from "../components/home/Categories";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <FeaturedProducts />
      <Categories />
    </div>
  );
};

export default Home;
