//* TITLE Alternative Timestamps **//
//* VERSION 1.1.0 **//
//* DESCRIPTION Adds timestamps to dashboard posts using a parsing method instead of AJAX calls. English tumblr interface only for now. **//
//* DEVELOPER Bit Shift **//
//* FRAME false **//
//* BETA true **//

XKit.extensions.alternative_timestamps = new Object({

	running: false,

	days_regex: /(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)/i,
	year_regex: /([1-9][0-9]*)\,/,

	preferences: {
		format_string: {
			text: 'Format string',
			type: 'text',
			default: 'YYYY-MM-DD HH:mm :: RR'
		},
		format_syntax_header: {
			text: 'Format string syntax',
			type: 'separator'
		}
	},

	run: function() {
		this.running = true;
		XKit.tools.init_css('alternative_timestamps');

		XKit.post_listener.add('alternative_timestamps_insert', this.insert_timestamps);

		this.insert_timestamps();
	},

	insert_timestamps: function() {
		$('#posts .post.with_permalink').add('#inboxposts .post.with_permalink').not('.alternative_timestamp_done').each(function(index) {
			$(this).addClass('alternative_timestamp_done');

			var moment_timestamp = XKit.extensions.alternative_timestamps.parse_timestamp($(this));

			if(moment_timestamp !== null) {
				var post_id = $(this).attr('id').replace('post_', '');

				var $timestamp = $('<div>');
				$timestamp.attr('id', 'alternative_timestamp_' + post_id);
				$timestamp.addClass('alternative_timestamp');
				$timestamp.text(XKit.extensions.alternative_timestamps.render_timestamp(moment_timestamp));

				$(this).find('.post_info').first().append($timestamp);
			}
		});
	},

	remove_timestamps: function() {
		$('.alternative_timestamp_done').removeClass('alternative_timestamp_done');
		$('.alternative_timestamp').remove();
	},

	strip_ordinals: function(date_string) {
		return date_string.replace(/([0-9])(?:st|nd|rd|th)/i, "$1");
	},

	parse_timestamp: function($post) {
		var permalink_title = $post.find('.post_permalink').attr('title');
		if(permalink_title.indexOf('-') < 0) { return null; }

		var permalink_time = permalink_title.slice(permalink_title.indexOf('-') + 2);

		var moment_post_time = moment(); // wrong, but next it's refined

		if(permalink_time.match(this.days_regex) !== null) {
			// "{day of week}, {time}"

			var day_name = permalink_time.match(this.days_regex)[1];
			var _permalink_time = permalink_time.replace(this.days_regex, "");
			var moment_permalink_time = moment(_permalink_time, 'h:mma');

			moment_post_time.hours(moment_permalink_time.hours());
			moment_post_time.minutes(moment_permalink_time.minutes());

			while(moment_post_time.format("dddd") !== day_name) {
				moment_post_time.subtract(moment.duration(1, 'days'));
			}
		} else if(permalink_time.match(',') === null) {
			// "{time}"

			var moment_permalink_time = moment(permalink_time, 'h:mma');

			moment_post_time.hours(moment_permalink_time.hours());
			moment_post_time.minutes(moment_permalink_time.minutes());
		} else if(permalink_time.match(this.year_regex) === null) {
			// "{month} {day}{ordinal}, {time}"

			var _permalink_time = this.strip_ordinals(permalink_time);
			var moment_permalink_time = moment(_permalink_time, 'MMM D, h:mma');

			moment_post_time.month(moment_permalink_time.month());
			moment_post_time.date(moment_permalink_time.date());
			moment_post_time.hours(moment_permalink_time.hours());
			moment_post_time.minutes(moment_permalink_time.minutes());
		} else {
			// "{month} {day}{ordinal} {year}, {time}"

			var _permalink_time = this.strip_ordinals(permalink_time);
			var moment_permalink_time = moment(_permalink_time, 'MMM D YYYY, h:mma');

			moment_post_time.year(moment_permalink_time.year());
			moment_post_time.month(moment_permalink_time.month());
			moment_post_time.date(moment_permalink_time.date());
			moment_post_time.hours(moment_permalink_time.hours());
			moment_post_time.minutes(moment_permalink_time.minutes());
		}

		return moment_post_time;
	},

	render_timestamp: function(moment_timestamp, format_string) {
		format_string = format_string || this.preferences.format_string.value;

		format_string = format_string.replace(/\[(.*)\]/g, this.escape_raw);
                format_string = format_string.replace(/RR/g, this.escape_raw(null, moment_timestamp.fromNow()));

		return moment_timestamp.format(format_string);
	},

	escape_raw: function(full_match, raw_block) {
		return raw_block.replace(/./g, function(c) {
			return '\\' + c;
		});
	},

	destroy: function() {
		this.running = false;
		XKit.tools.remove_css('alternative_timestamps');

		XKit.post_listener.remove('alternative_timestamps_insert');

		this.remove_timestamps();
	},

	cpanel: function($panel) {
		$.each(this.format_syntax, function(code, description) {
			var $syntax_line = $('<div>');
			$syntax_line.addClass('xkit-extension-setting');
			$syntax_line.append($('<div>').addClass('title').text(code));
			$syntax_line.append($('<div>').text(description));
			$syntax_line.append($('<div>').addClass('alternative_timestamps_preview').text(XKit.extensions.alternative_timestamps.render_timestamp(moment(), code)));

			$panel.append($syntax_line);
		});
	},

	format_syntax: {
		'[text]': 'Raw text block',
		'RR': 'Relative timestamp',
		'M': 'Month number',
		'Mo': 'Month number with ordinal',
		'MM': 'Month number with leading 0',
		'MMM': 'Month name, short',
		'MMMM': 'Month name, full',
		'D': 'Day of month number',
		'Do': 'Day of month number with ordinal',
		'DD': 'Day of month number with leading 0',
		'DDD': 'Day of year number',
		'DDDo': 'Day of year number with ordinal',
		'DDDD': 'Day of year number with leading 0s',
		'd': 'Day of week number',
		'do': 'Day of week number with ordinal',
		'ddd': 'Day of week name, short',
		'dddd': 'Day of week name, full',
		'w': 'Week of year number',
		'wo': 'Week of year number with ordinal',
		'ww': 'Week of year number with leading 0',
		'YY': 'Year without centuries',
		'YYYY': 'Year with centuries',
		'a': 'am/pm',
		'A': 'AM/PM',
		'H': 'Hour, 24-hour time',
		'HH': 'Hour with leading 0, 24-hour time',
		'h': 'Hour, 12-hour time',
		'hh': 'Hour with leading 0, 12-hour time',
		'm': 'Minute',
		'mm': 'Minute with leading 0'
	}
});