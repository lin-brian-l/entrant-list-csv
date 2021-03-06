import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { NgxSpinnerService } from "ngx-spinner";

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

export class AppComponent {
  tournamentUrl: string;
  tournamentName: string;
  events: Event[];
  participatedEvents: ParticipatedEvent[];
  participants: Participant[];
  csvOptions: any = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: false,
    // headers: ['Tag'],
    showTitle: true,
    useBom: false,
    removeNewLines: true,
    // keys: ['tag']
  }
  csvData: any[];

  constructor(
    private http: HttpClient,
    private spinnerService: NgxSpinnerService
  ) { }

  async submitUrl() {
    console.log("before checking valid url");
    this.tournamentName = this.tournamentUrl ? this.tournamentUrl.match(/(?<=tournament\/)[^\/]*/)[0] : undefined;
    if (this.tournamentName) {
      this.spinnerService.show();
      try {
        await this.getAllTournamentData();
        this.createCSVData();
      } catch (error) {
        alert('An error has occurred. Please double-check your Smash.gg url.');
      }
      this.spinnerService.hide();
    } else {
      alert("Enter a valid Smash.gg tournament url.");
    }
  }

  async getAllTournamentData() {
    try {
      await this.getParticipantsAndEvents();
      await this.getAllEventsData();
    } catch (error) {
      throw new Error(error);
    }
  }

  getParticipantsAndEvents() {
    const tournamentUrl: string = `https://cors-anywhere.herokuapp.com/https://api.smash.gg/tournament/${this.tournamentName}?expand[]=participants&expand[]=event`
    return this.http.get(tournamentUrl)
    .toPromise()
    .then((data: any) => {
      this.events = data.entities.event.map((event: any) => {
        return { id: event.id, name: event.name }
      });
      this.participatedEvents = this.events.map((event: Event) => {
        return { name: event.name, participated: false };
      });
      this.participants = data.entities.participants.map((participant: any) => {
        let participatedEvents = this.events.map((event: Event) => {
          return { name: event.name, participated: false };
        });
        return {
          id: participant.id,
          tag: participant.gamerTag,
          participatedEvents
        }
      })
    })
  }

  async getAllEventsData() {
    let eventPromises = [];
    this.events.forEach((event: Event) => {
      eventPromises.push(this.getEventData(event.id));
    })
    try {
      await Promise.all(eventPromises);
    } catch (error) {
      throw new Error(error);
    }
  }

  async getEventData(eventId: number) {
    const eventUrl: string = `https://cors-anywhere.herokuapp.com/https://api.smash.gg/event/${eventId}?expand[]=entrants`;
    await this.http.get(eventUrl)
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
    })
  }

  createCSVData(): void { 
    this.csvData = this.participants.map((participant: Participant, participantIndex: number) => {
      let csvItem = { tag: participant.tag };
      if (participantIndex === 0) {
        this.csvOptions.headers = ["Tag"];
        this.csvOptions.keys = ['tag'];
      }
      participant.participatedEvents.forEach((event: ParticipatedEvent) => {
        csvItem[event.name] = event.participated ? "Y" : "";
        if (participantIndex === 0) this.editCSVOptions(event);
      })
      return csvItem;
    })
  }

  editCSVOptions(event: ParticipatedEvent) {
    this.csvOptions.title = `Entrant Data for ${this.formatTournamentName(this.tournamentName)}`
    this.csvOptions.headers.push(event.name);
    this.csvOptions.keys.push(event.name);
  }

  formatTournamentName(name: string): string {
    return name.toLowerCase()
    .split('-')
    .map((word: string) => {
      return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
  }

}