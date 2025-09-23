import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EventSubmissionForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    contact: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Event submission:", formData);
    
    toast({
      title: "Спасибо за предложение!",
      description: "Мы рассмотрим ваше мероприятие и добавим его в наш список.",
    });
    
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      organizer: "",
      contact: "",
    });
  };

  return (
    <Card 
    className="max-w-2xl mx-auto event-card
                    p-1
                    transition-all duration-250 ease-out
                    md:hover:scale-103 md:hover:-translate-y-1
                    md:hover:shadow-xl md:hover:shadow-primary/25
                    active:scale-100 active:translate-y-0
                    cursor-pointer"
    >
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          Предложить мероприятие
        </CardTitle>
      </CardHeader>
      
      <CardContent className="-m-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название мероприятия *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Название события"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organizer">Организатор</Label>
              <Input
                id="organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                placeholder="Кто организует"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Описание мероприятия *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Расскажите подробнее о мероприятии..."
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                <Calendar size={16} className="mr-2" />
                Дата проведения *
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center">
                <Clock size={16} className="mr-2" />
                Время
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleInputChange}
                placeholder="19:00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center">
              <MapPin size={16} className="mr-2" />
              Место проведения *
            </Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Адрес или название места"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact">Контакт для связи</Label>
            <Input
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              placeholder="Email или телефон"
            />
          </div>
          
          <Button
            type="submit"
            className="w-full btn-cultural 
                      group 
                      transition-all duration-300 
                      hover:scale-105 hover:shadow-lg 
                      active:scale-95"
          >
            <Send
              size={16}
              className="mr-2 transition-transform duration-300 group-hover:scale-120 group-hover:rotate-12"
            />
            Отправить предложение
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventSubmissionForm;