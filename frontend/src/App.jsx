
import { useState, useEffect, useRef } from 'react';
import './App.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [preference, setPreference] = useState('Adventure');
  const [itinerary, setItinerary] = useState('');
  const [reminders, setReminders] = useState([]);
  const [dueReminders, setDueReminders] = useState([]);
  const notifiedReminders = useRef([]);
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}, []);
  useEffect(() => {
    function checkDueReminders() {
        const now = new Date();

        const due = reminders.filter((reminder) => {
            const reminderTime = new Date(
                reminder.dueAt || reminder.dueDate
            );

            return !isNaN(reminderTime.getTime()) &&
                   reminderTime <= now;
        });

        setDueReminders(due);

        if ("Notification" in window && Notification.permission === "granted") {
            due.forEach((reminder) => {
                const reminderId = String(reminder.id);

                if (!notifiedReminders.current.includes(reminderId)) {
                    new Notification(reminder.title, {
                        body: reminder.message,
                        icon: "/favicon.ico"
                    });

                    notifiedReminders.current.push(reminderId);
                }
            });
        }
    }

    checkDueReminders();

    const timer = setInterval(checkDueReminders, 30000);

    return () => clearInterval(timer);
}, [reminders]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setItinerary('');
    setReminders([]);

    try {
      const response = await fetch('http://localhost:5000/api/generate-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          destination,
          startDate,
          endDate,
          budget,
          preference
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to generate itinerary');
      }

      setItinerary(data.itinerary);
      setReminders(data.reminders || []);

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2>✈ TravelMate AI</h2>
        <a href="#planner">Plan Your Trip</a>
      </nav>

      <section className="hero">
        <p className="tagline">YOUR PERSONAL AI TRAVEL ASSISTANT</p>
        <h1>Explore More.<br />Worry Less.</h1>
        <p>
          Discover amazing destinations and create personalised
          travel itineraries with the power of AI.
        </p>
        <a href="#planner" className="hero-button">Start Planning →</a>
      </section>

      <section className="planner" id="planner">
        <h2>Plan Your Dream Trip</h2>
        <p>Tell us about your journey. Let AI plan the rest!</p>

        <form onSubmit={handleSubmit}>
          <label>Destination</label>
          <input
            type="text"
            placeholder="Where do you want to go?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />

          <div className="date-fields">
            <div>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <label>Budget (₹)</label>
          <input
            type="number"
            placeholder="Enter your budget"
            min="1"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />

          <label>Travel Preference</label>
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value)}
          >
            <option>Adventure</option>
            <option>Nature</option>
            <option>Relaxation</option>
            <option>Spiritual</option>
            <option>Sightseeing</option>
          </select>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Your Itinerary...' : 'Generate My Trip ✨'}
          </button>
        </form>

        {itinerary && (
          <div className="result">
            <h2>✨ Your AI Travel Itinerary</h2>

            <div className="itinerary-content">
  <ReactMarkdown
  remarkPlugins={[remarkGfm]}>
    {itinerary}
  </ReactMarkdown>
</div>
          </div>
        )}

        {reminders.length > 0 && (
          <div className="reminders-section">
            <h2>🔔 Your Personalised Travel Reminders</h2>
            <p>AI-generated reminders to help you prepare for your trip.</p>

            {reminders.map((reminder) => (
              <div className="reminder-card" key={reminder.id}>
                <h3>{reminder.title}</h3>
                <p>{reminder.message}</p>
                <span className="reminder-category">
                  {reminder.category}
                </span>
                <p className="reminder-date">
                  Due: {reminder.dueDate || reminder.dueAt}
                </p>
              </div>
            ))}
          </div>
        )}
                 {dueReminders.length > 0 && (
          <div className="due-reminders-section">
            <h2>⏰ Reminders Due Now</h2>

            {dueReminders.map((reminder) => (
              <div className="reminder-card" key={reminder.id}>
                <h3>{reminder.title}</h3>
                <p>{reminder.message}</p>
                <p>Time to complete this task!</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer>
        <p>© 2026 TravelMate AI | Explore the world intelligently.</p>
      </footer>
    </div>
  );
}

export default App;
