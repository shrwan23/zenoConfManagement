import * as _ from "lodash";
import { Injectable } from '@angular/core';

import { Talk } from '../models/Talk';
import { Track } from '../models/Track';

@Injectable()
export class ConferenceSchedulerService {

    // read & parse the Input String
	private parseInput(rawInput:string):Talk[] {
		return _.map(_.split(rawInput, '\n'), (rawLine:string) => this.parseLine(rawLine));
	}

    // read & parse each line
	private parseLine(rawLine:string):Talk {
		let toSplitBy:string|RegExp = _.includes(rawLine, 'lightning') ? 'lightning' : /[0-9]/,
			talkName:string = _.trim(_.split(rawLine, toSplitBy)[0]),
			talkTimeMinutes:number = 5; // First assume 'lightning'(5 mins)

		if(toSplitBy != 'lightning') { // if not 'lightning'
			talkTimeMinutes = parseInt(_.trim(_.trim(_.split(rawLine, talkName)[1]), 'min'));
		}

		return new Talk(talkName, talkTimeMinutes);
	}

	public schedule(rawInput:string):Track[] {
		// let talks:Talk[] = _.orderBy(this.parseInput(rawInput), ['minutes'], ['desc']);
		let talks:Talk[] = this.parseInput(rawInput);

		// Assumptions: 
		// 1. There is no minimum talk time, maximum talk time is 4 hours, unit of time is 1 minute
		// 2. The morning session can finish any time before lunch (12:00)
		// 3. The afternoon session can finish any time before the networking event (16:00-17:00 start)


		let tracks:Track[] = [new Track()];

		_.forEach(talks, (talk:Talk) => {
			let talkPlaced:boolean = false;

			_.forEach(tracks, (track:Track) => {
				if(talkPlaced) {
					return false; // Break out of forEach
				}
                else if(track.morningSession.freeMinutes() >= talk.minutes) {
                    track.morningSession.addTalk(talk);
                    talkPlaced = true;
                }
				else if(track.afternoonSession.freeMinutes() >= talk.minutes) {
					track.afternoonSession.addTalk(talk);
					talkPlaced = true;
				}
			});

			if(!talkPlaced) {
				let newTrack:Track = new Track();
				newTrack.morningSession.addTalk(talk);
				tracks.push(newTrack);
			}
		});

		// adding all Lunch, fix @12
        _.forEach(tracks, (track:Track) => {
			track.morningSession.addLunch();
		});

		// adding all Networking Events, starting between 4-5
		_.forEach(tracks, (track:Track) => {
			track.afternoonSession.addNetworkingEvent();
		});

		return tracks;
	}

}