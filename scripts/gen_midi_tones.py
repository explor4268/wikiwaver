import sys
import argparse
import mido

def main():
    parser=argparse.ArgumentParser(
            description="Generates a MIDI file containing a single tone or chord.")
    parser.add_argument("notes",type=str,help="MIDI tone/note to play. C4 is 60. Pass multiple tones separated with commas to play a chord. Example: 60,64,67")
    parser.add_argument("instrument",type=int,help="MIDI instrument/program to play.")
    parser.add_argument("bpm",type=float,help="Beats per Minute rate of the file.")
    parser.add_argument("velocity",type=int,help="Velocity of the note.")
    parser.add_argument("start_time_s",type=float,help="Start time of the note in seconds.")
    parser.add_argument("duration_s",type=float,help="Note duration in seconds.")
    parser.add_argument("output",type=str,help="Output file destination for resulting MIDI file.")
    parser.add_argument("-s","--silent",action="store_true",help="Silence the command line output")
    args=parser.parse_args()

    silent=args.silent
    if args.output=="-":
        silent=True

    notes=args.notes.split(",")
    for i in range(len(notes)):
        notes[i]=int(notes[i])
        if notes[i]>127 or notes[i]<0:
            if not silent:
                print(f"Invalid note: {notes[i]}. Exiting...")
            return 1

    if not silent:
        print(f"Generating a MIDI file to {args.output}")

    mid=mido.MidiFile()
    trk=mido.MidiTrack()
    mid.tracks.append(trk)

    tempo=mido.bpm2tempo(args.bpm)
    
    def seconds_to_ticks(s):
        return int(round(s*mid.ticks_per_beat*1_000_000/tempo))

    trk.append(mido.MetaMessage("set_tempo",tempo=tempo,time=0))
    trk.append(mido.Message("program_change",program=args.instrument,time=0))
    for note in notes:
        trk.append(mido.Message("note_on",note=note,velocity=args.velocity,time=seconds_to_ticks(args.start_time_s)))
    is_first_note=True
    for note in notes:
        ttime=0
        if is_first_note:
            ttime=seconds_to_ticks(args.duration_s)
            is_first_note=False
        trk.append(mido.Message("note_off",note=note,velocity=0,time=ttime))
    trk.append(mido.MetaMessage("end_of_track",time=0))

    if args.output=="-":
        mid.save(file=sys.stdout.buffer)
    else:
        mid.save(args.output)

    if not silent:
        print("Done!")

    return 0

if __name__=="__main__":
    sys.exit(main())
