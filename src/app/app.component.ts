import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";

type Event = {
  id: number;
  name: string;
}

type ParticipatedEvent = {
  name: string;
  participated: boolean;
}

type Participant = {
  id: number;
  tag: string;
  participatedEvents: ParticipatedEvent[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit {
  tournamentUrl: string = "https://smash.gg/tournament/tripoint-smash-15/events";
  // tourneyUrl: string;
  tournamentName: string = "tripoint-smash-15";
  events: Event[];
  participatedEvents: ParticipatedEvent[];
  participants: Participant[];

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    console.log("Component initiated");
    this.getAllTournamentData();
  }

  async getAllTournamentData() {
    console.log("inside getAllTournamentData()");
    await this.getParticipantsAndEvents();
    this.getAllEventsData();
    // setTimeout(this.getAllEventsData.bind(this), 5000);
  }

  getParticipantsAndEvents() {
    const tournamentUrl: string = `https://cors-anywhere.herokuapp.com/https://api.smash.gg/tournament/${this.tournamentName}?expand[]=participants&expand[]=event`
    return this.http.get(tournamentUrl)
    .toPromise()
    .then((data: any) => {
      this.events = data.entities.event.map((event: any) => {
        return {
          id: event.id,
          name: event.name
        }
      });
      this.participatedEvents = this.events.map((event: Event) => {
        return {
          name: event.name,
          participated: false,
        }
      });
      // const participatedEvents: ParticipatedEvent[] = this.participatedEvents.slice(0);
      console.dir(this.participatedEvents);
      console.log("^^^^^^^^^^^ this.participatedevents");
      this.participants = data.entities.participants.map((participant: any) => {
      // console.dir(participatedEvents);
        let participatedEvents = this.events.map((event: Event) => {
          return {
            name: event.name,
            participated: false,
          }
        });        
        return {
          id: participant.id,
          tag: participant.gamerTag,
          participatedEvents
          // participatedEvents: Array.from(this.participatedEvents)
        }
      })
      console.dir(this.participants);
    })
  }

  getAllEventsData() {
    // console.log("********* participants before edits ***********")
    // console.dir(this.participants);
    // console.log("********* participants before edits ***********")
    // this.getEventData(this.events[2].id);
    this.events.forEach((event: Event) => {
      this.getEventData(event.id);
    })
  }

  getEventData(eventId: number) {
    console.log("inside event data: " + eventId);
    const eventUrl: string = `https://cors-anywhere.herokuapp.com/https://api.smash.gg/event/${eventId}?expand[]=entrants`;
    this.http.get(eventUrl)
      .toPromise()
      .then((data: any) => {
        const eventIndex: number = this.participatedEvents.findIndex((event: ParticipatedEvent) => {
          return event.name === data.entities.event.name;
        })
        data.entities.entrants.forEach((entrant: any) => {
          entrant.participantIds.forEach((participantId: number) => {
            let participantIndex: number = this.participants.findIndex((participant: Participant) => {
              return participant.id === participantId;
            });
            this.participants[participantIndex].participatedEvents[eventIndex].participated = true;
          })
        })
        console.log(`after editing ${eventId}`);
        console.dir(this.participants);
        console.log(`after editing ${eventId}`);
      })
  }

  downloadCSV() {
    console.log("start download");
  }

}
