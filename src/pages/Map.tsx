import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Clock, Search, ArrowUp } from "lucide-react";
import { Link } from "react-router-dom";
import { YMaps, Map as YMap, Placemark, ZoomControl, GeolocationControl } from "@pbe/react-yandex-maps";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import EventSubmissionForm from "@/components/EventSubmissionForm";

import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  startOfDay,
  isBefore
} from "date-fns";
import ru from "date-fns/locale/ru";

const parseDate = (dateStr) => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const firstDate = dateStr.split(',')[0].trim();
  const parts = firstDate.split(' ');
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const monthMap = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
    'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };
  const month = monthMap[monthStr] || '01';
  const year = new Date().getFullYear();
  return `${year}-${month}-${day.toString().padStart(2, '0')}`;
};

const capitalizeFirstLetter = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const formatDotDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const groupEventsByCoordinates = (events) => {
  const grouped = {};
  events.forEach(event => {
    const key = `${event.coordinates.lat},${event.coordinates.lng}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(event);
  });
  return Object.values(grouped);
};

const Map = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const spreadsheetId = '1U1qBrsnQsv2wn0EkGU7GPMZX88wcHKnc2hvHkdykUZk';
        const apiKey = 'AIzaSyBScuwFWwr9fhUpAnKytPYfiAlf8bw2voQ';
        const range = 'A1:K';
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
          throw new Error('No data found in the sheet');
        }
        
        const headers = data.values[0];
        const rows = data.values.slice(1);
        
        const rawEvents = rows.map((row, index) => {
          const eventObj = { id: index + 1 };
          headers.forEach((header, index) => {
            eventObj[header] = row[index] || '';
          });
          return eventObj;
        });
        
        const mappedEvents = rawEvents.map((event, index) => {
          const [lat, lng] = event['Координаты'] ? event['Координаты'].split(',').map(coord => parseFloat(coord.trim())) : [0, 0];
          return {
            id: index + 1,
            title: event['Название'] || '',
            description: event['Краткое описание'] || '',
            date: parseDate(event['Дата'] || ''),
            time: event['Время'] || '',
            location: event['Место'] || '',
            address: event['Адрес'] || '',
            category: event['Жанр'] || '',
            cost: event['Стоимость'] || '',
            image: event['Фото'] || '',
            link: event['Ссылка'] || '',
            coordinates: { lat, lng }
          };
        }).filter(event => event.title && event.coordinates.lat && event.coordinates.lng);
        
        setEvents(mappedEvents);
      } catch (err) {
        console.error('Error fetching from Google Sheets:', err);
        setError(`Error fetching data: ${err.message}. Make sure the sheet is publicly accessible.`);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const uniqueDates = Array.from(new Set(events.map(event => event.date))).sort();
  const filteredEvents = events.filter(event => event.date === (selectedDate || todayStr));
  const groupedEvents = groupEventsByCoordinates(filteredEvents);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric',
      month: 'short'
    });
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const isDateAvailable = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return uniqueDates.includes(dateString);
  };

  const isFutureOrToday = (date) => {
    return !isBefore(date, new Date());
  };

  const handleDateClick = (date) => {
    const normalizedDate = startOfDay(date);
    const dateString = format(normalizedDate, 'yyyy-MM-dd');

    if (selectedDate === dateString) {
      setIsCalendarOpen(true);
    } else {
      setSelectedDate(dateString);
      setIsCalendarOpen(false);
    }
  };

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDaysOfWeek = () => {
    return ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Карта мероприятий Минска
          </h1>
          <p className="text-muted-foreground text-lg">
            Найдите интересные события рядом с вами
          </p>
        </div>

        {error ? (
          <div className="text-center py-12 max-w-md mx-auto">
            <MapPin size={64} className="mx-auto text-muted-foreground mb-6" />
            <h3 className="text-xl font-semibold mb-4">{error}</h3>
            <Link to="/events">
              <Button className="btn-cultural">
                Все мероприятия
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px] relative overflow-hidden">
                <div className="absolute inset-0">
                  <YMaps>
                    <YMap
                      defaultState={{ center: [53.9023, 27.5619], zoom: 12 }}
                      width="100%"
                      height="100%"
                      options={{
                        suppressMapOpenBlock: true,
                      }}
                    >
                      <ZoomControl options={{ position: { right: 16, top: 16 } }} />
                      <GeolocationControl options={{ position: { right: 16, top: 64 } }} />
                      {groupedEvents.map((group, index) => {
                        const firstEvent = group[0];
                        const hasMultiple = group.length > 1;

                        return (
                          <Placemark
                            key={`placemark-${firstEvent.id}`}
                            geometry={[firstEvent.coordinates.lat, firstEvent.coordinates.lng]}
                            properties={{
                              balloonContentHeader: hasMultiple 
                                ? `Мероприятия (${group.length})` 
                                : firstEvent.title,
                              balloonContentBody: hasMultiple
                                ? group.map(e => `<div><strong>${e.title}</strong><br/>${e.time} — ${e.location}</div>`).join('<br/><br/>')
                                : `<div>${firstEvent.location}<br/>${firstEvent.address}</div>`,
                              hintContent: hasMultiple 
                                ? `Мероприятия (${group.length})` 
                                : firstEvent.title,
                            }}
                            options={{
                              preset: group.some(e => selectedEventIds.includes(e.id)) 
                                ? 'islands#redIcon' 
                                : 'islands#blueIcon',
                              openBalloonOnClick: true,
                            }}
                            modules={["geoObject.addon.hint", "geoObject.addon.balloon"]}
                            onClick={() => {
                              const ids = group.map(e => e.id);
                              setSelectedEventIds(ids);
                              const element = document.getElementById(`event-card-${ids[0]}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                          />
                        );
                      })}
                    </YMap>
                  </YMaps>
                </div>

                <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg space-y-3" ref={calendarRef}>
                  <div className="text-sm font-medium text-primary">Легенда и фильтр</div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-300/50"></div>
                      <span>Сегодня</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500/30"></div>
                      <span>Выбранная дата</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border bg-red-200"></div>
                      <span>Доступная дата</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-200 opacity-50"></div>
                      <span>Недоступно</span>
                    </div>
                  </div>

                  <div className="w-full relative">
                    <button
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className={`w-full h-10 px-3 py-2 rounded-lg border ${isCalendarOpen ? 'border-primary' : 'border-gray-300'} 
                                text-gray-700 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors`}
                    >
                      <span className="text-sm truncate">
                        {selectedDate ? formatDotDate(selectedDate) : 'дд.мм.гг'}
                      </span>
                      <Calendar size={16} />
                    </button>
                    {isCalendarOpen && (
                      <div className="absolute top-full left-0 w-64 p-4 bg-white border rounded-lg shadow-xl z-50 mt-1">
                        <div className="flex justify-between items-center mb-4">
                          <button
                            onClick={goToPrevMonth}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            ←
                          </button>
                          <h3 className="font-medium text-gray-800">
                            {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                          </h3>
                          <button
                            onClick={goToNextMonth}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            →
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {getDaysOfWeek().map(day => (
                            <div key={day} className="text-center text-xs text-gray-500 font-medium">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-3">
                          {daysInMonth.map(date => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isToday = isSameDay(date, new Date());
                            const isSelected = selectedDate === dateStr;
                            const isAvailable = isDateAvailable(date) && isFutureOrToday(date);

                            let buttonClass = "w-8 h-8 text-sm rounded-full transition-colors flex items-center justify-center ";

                            if (isSelected) {
                              buttonClass += "bg-green-500/30 text-green-700 font-bold";
                            } else if (isToday) {
                              buttonClass += "bg-blue-500/30 text-blue-700 border border-blue-300/50";
                            } else if (isAvailable) {
                              buttonClass += "hover:bg-primary/10 text-primary cursor-pointer";
                            } else {
                              buttonClass += "text-gray-300 cursor-not-allowed opacity-50";
                            }

                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => handleDateClick(date)}
                                disabled={!isAvailable}
                                className={buttonClass}
                              >
                                {date.getDate()}
                              </button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDate("");
                            setIsCalendarOpen(false);
                          }}
                          className="w-full text-primary border-primary/30 hover:bg-primary/5"
                        >
                          Сбросить фильтр
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Мероприятия на карте</h2>
              
              {filteredEvents.map((event, index) => (
                <Card 
                  id={`event-card-${event.id}`}
                  key={event.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedEventIds.includes(event.id) ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedEventIds([event.id])}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {capitalizeFirstLetter(event.category)}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {event.location}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar size={14} className="mr-2" />
                      {formatDate(event.date)}
                    </div>
                    
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock size={14} className="mr-2" />
                      {event.time}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {event.address}
                    </div>
                    <Link to={`/event/${event.id}`} className="block w-full">
                      <Button
                        className="w-full btn-outline-cultural 
                                  group 
                                  transition-all duration-300 
                                  hover:scale-105 hover:shadow-lg hover:shadow-primary/20 
                                  active:scale-95 mt-2"
                      >
                        Подробнее
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}

              {filteredEvents.length === 0 && (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    На выбранную дату событий нет.
                  </CardContent>
                </Card>
              )}
              
              <Card className="border-dashed border-2 border-muted-foreground/30">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <MapPin size={32} className="text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Не видите свое мероприятие на карте?
                  </p>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex items-center group transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 active:scale-95 will-change-transform backface-visibility-hidden"
                      >
                        Предложить мероприятие
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 md:p-8">
                      <EventSubmissionForm />
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-5 z-50 p-3 bg-primary text-white rounded-full shadow-lg
                    transition-all duration-300 ease-in-out transform
                    ${showScrollTop 
                      ? 'opacity-100 pointer-events-auto scale-100' 
                      : 'opacity-0 pointer-events-none scale-90'
                    }`}
        aria-label="Вернуться к началу"
      >
        <ArrowUp size={24} />
      </button>

      <Footer />
    </div>
  );
};

export default Map;