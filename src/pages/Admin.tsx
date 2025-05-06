import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash } from "lucide-react";

interface Spot {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  priceRange: number;
  category: string;
}

const mockSpots: Spot[] = [
  {
    id: "1",
    name: "The Secret Garden",
    description: "A hidden gem with romantic garden seating and fairy lights.",
    imageUrl: "https://images.unsplash.com/photo-1472396961693-142e6e269027",
    rating: 4.8,
    priceRange: 3,
    category: "Restaurants",
  },
  {
    id: "2",
    name: "Sunset Cafe",
    description: "Perfect spot for watching the sunset while enjoying artisanal coffee.",
    imageUrl: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
    rating: 4.5,
    priceRange: 2,
    category: "Cafes",
  },
];

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // בהמשך נחליף את זה באימות אמיתי
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-primary-light/20 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">כניסת מנהל</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">שם משתמש</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              התחבר
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light/20 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ניהול מקומות</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-4 px-2">שם</th>
                  <th className="text-right py-4 px-2">קטגוריה</th>
                  <th className="text-right py-4 px-2">דירוג</th>
                  <th className="text-right py-4 px-2">טווח מחירים</th>
                  <th className="text-right py-4 px-2">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {mockSpots.map((spot) => (
                  <tr key={spot.id} className="border-b">
                    <td className="py-4 px-2">{spot.name}</td>
                    <td className="py-4 px-2">{spot.category}</td>
                    <td className="py-4 px-2">{spot.rating}</td>
                    <td className="py-4 px-2">{"$".repeat(spot.priceRange)}</td>
                    <td className="py-4 px-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;