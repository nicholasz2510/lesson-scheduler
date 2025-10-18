import withMT from "@material-tailwind/react/utils/withMT";

export default withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        card: "0 10px 30px -12px rgba(13, 148, 136, 0.35)",
      },
    },
  },
  plugins: [],
});
