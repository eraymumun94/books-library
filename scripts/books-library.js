function startApp() {
    // Clear user auth data
    sessionStorage.clear();

    showHideMenuLinks();

    showView('viewHome');

    // Bind the navigation menu links
    $('#linkHome').click(showHomeView);
    $('#linkLogin').click(showLoginView);
    $('#linkRegister').click(showRegisterView);
    $('#linkListBooks').click(listBooks);
    $('#linkCreateBook').click(showCreateBookView);
    $('#linkLogout').click(logoutUser);


    // Bind the form submit button
    $('#formLogin').submit(loginUser);
    // и submit се хваща не бутона, а цялата форма
    $('#formRegister').submit(registerUser);
    $('#buttonCreateBook').click(createBook);
    $('#buttonEditBook').click(editBook);

    $('#infoBox, #errorBox').fadeOut(1000);

    // Attach ajax 'loading' event listener
    $(document).on({
        ajaxStart: function () { $('#loadingBox').show() },
        ajaxStop: function () { $('#loadingBox').hide() }
    });

    const kinveyBaseUrl = 'https://baas.kinvey.com/';
    const kinveyAppKey = 'kid_S1YBljaBZ';
    const kinveyAppSecret = '7846050319ab4d159190b3e4a21d4ce3';
    const kinveyAppAuthHeaders = {
        'Authorization': 'Basic ' + btoa(kinveyAppKey + ":" + kinveyAppSecret)
    };

    let button = $('<button>');
    button.text('GET AUTHORS');
    $('#viewBooks').append(button);
    button.click(function () {
        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/booksApp",
            headers: getKinveyAuthHeaders(),
            success: getAuthors
        });
        function getAuthors(books) {
            let table = $(`
                    <table id="authorsTable">
                        <tr>
                            <th>Authors</th> 
                        </tr>
                    </table>`);
            table.css('display','none');
            table.fadeIn(3000);
            for(let book of books) {
                let tr = $('<tr>');
                let td = $('<td>').text(book.author);
                tr.append(td);
                table.append(tr);
            }
            $('#books').append(table);

            button.fadeOut();

            let skipButton = $('<button>Skip</button>');
            $('#viewBooks').append(skipButton);
            skipButton.click(function () {
                table.fadeOut(3000);
                button.fadeIn(3000);
                $(this).fadeOut(3000);
            })
        }
    });
    function showHideMenuLinks() {
        $('#menu a').hide();
        if(sessionStorage.getItem('authToken')) {
            // Logged in user
            $('#linkHome').fadeIn(3000);
            $('#linkListBooks').fadeIn(3000);
            $('#linkLogout').fadeIn(3000);
            $('#linkCreateBook').fadeIn(3000);
        }
        else {
            // No user logged
            $('#linkHome').fadeIn(3000);
            $('#linkLogin').fadeIn(3000);
            $('#linkRegister').fadeIn(3000);
        }

    }

    function showView(viewName) {
        // Hide ALl views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).fadeIn(3000);
    }

    function showHomeView() {
        showView('viewHome');
    }

    function showLoginView() {
        showView('viewLogin');
        // Clear username password on login form
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        showView('viewRegister');
        // Clear username password on register form
        $('#formRegister').trigger('reset');
    }

    // authtoken на потребителя, който е логнат
    function getKinveyAuthHeaders() {
        return {
            "Authorization" : "Kinvey " + sessionStorage.getItem('authToken')
        }
    }

    function listBooks() {
        $('#books').empty();
        showView('viewBooks');
        $.ajax({
            method: 'GET',
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/booksApp",
            headers: getKinveyAuthHeaders(),
            success: displayBooks,
            error: notBooks
        });
    }

    function displayBooks(books) {
        let table = $(`
                    <table>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </table>`);

        table.hide();
        table.fadeIn(4000);

        for(let book of books) {
            let links = [];
            if(book._acl.creator === sessionStorage.getItem('userId')) {
                let deleteLink = $('<a href="#">[Delete]</a>').click(function () {
                    deleteBookById(book._id);
                });
                let editLink = $('<a href="#">[Edit]</a>').click(function () {
                    loadBookForEdit(book._id);
                });
                links.push(deleteLink, editLink);
            }
            let tr = $('<tr>');
            let titleTd = $('<td>').text(book.title);
            let authorTd =  $('<td>').text(book.author);
            let descriptionTd = $('<td>').text(book.description);
            let actionsTd = $('<td>').append(links);
            tr.append(titleTd, authorTd, descriptionTd, actionsTd);
            table.append(tr);
            $('#books').append(table);

        }
        function deleteBookById(bookId) {
            $.ajax({
                method: 'DELETE',
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/booksApp/" + bookId,
                headers: getKinveyAuthHeaders(),
                success: deleteBookSuccess,
                error: notBooks
            });

            function deleteBookSuccess() {
                showInfo('Book deleted.');
                listBooks();
            }
        }

        function loadBookForEdit(bookId) {
            $.ajax({
                method: 'GET',
                url: kinveyBookUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/booksApp/" + bookId,
                headers: getKinveyAuthHeaders(),
                success: loadBookForEditSuccess,
                error: notBooks
            });

            function loadBookForEditSuccess(book) {
                $('#formEditBook input[name=id]').val(book._id);
                $('#formEditBook input[name=title]').val(book.title);
                $('#formEditBook input[name=author]').val(book.author);
                $('#formEditBook textarea[name=desc]').val(book.description);
                showView('viewEditBook');
            }
        }
    }

    function notBooks() {
        showError('Error!')
    }

    function showCreateBookView() {
        // Clear title, author and description on create book form
        $('#formCreateBook').trigger('reset');
        showView('viewCreateBook')
    }

    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text('');
        showView('viewHome');
        showHideMenuLinks();
        showInfo('Logout success!')
    }

    function loginUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=password]').val(),
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey + '/login',
            data: JSON.stringify(userData),
            headers: kinveyAppAuthHeaders,
            contentType: 'application/json',
            success: loginUserSuccess,
            error: loginUserError
        });
        function loginUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User login successful.');
        }
        function loginUserError() {
            showError('User login error!');
        }
    }

    function registerUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=password]').val(),
        };

        $.ajax({
            method: 'POST',
            url: kinveyBaseUrl + 'user/' + kinveyAppKey,
            data: JSON.stringify(userData),
            headers: kinveyAppAuthHeaders,
            contentType: 'application/json',
            success: registerUserSuccess,
            error: registerUserError
        });
        function registerUserSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User Registration successful.');
        }
    }
    function saveAuthInSession(userInfo) {
        sessionStorage.setItem('username', userInfo.username);
        sessionStorage.setItem('authToken', userInfo._kmd.authtoken);
        sessionStorage.setItem('userId', userInfo._id);
        $('#loggedInUser').text(`Welcome, ${userInfo.username}`);
    }

    function registerUserError() {
        showError('User registration error!');
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }
    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function createBook() {
        const url = 'https://baas.kinvey.com/appdata/kid_S1YBljaBZ/booksApp';
        let bookInfo = {
            title: $('#formCreateBook input[name=title]').val(),
            author: $('#formCreateBook input[name=author]').val(),
            description: $('#formCreateBook textarea[name=desc]').val()
        };
        $.ajax({
            method: 'POST',
            data: bookInfo,
            url: url,
            headers: getKinveyAuthHeaders(),
            success: createBookSuccess,
            error: notBooks
        });
        function createBookSuccess() {
            showInfo('Book created succesfull.');
            listBooks();
        }
    }

    function editBook() {
        const url = 'https://baas.kinvey.com/appdata/kid_S1YBljaBZ/booksApp';
        let bookInfo = {
            title: $('#formEditBook input[name=title]').val(),
            author: $('#formEditBook input[name=author]').val(),
            description: $('#formEditBook textarea[name=desc]').val()
        };
        $.ajax({
            method: 'PUT',
            data: bookInfo,
            // id на hidden poleto!
            url: url + '/' + $('#formEditBook input[name=id]').val(),
            headers: getKinveyAuthHeaders(),
            success: createBookSuccess,
        });
        function createBookSuccess() {
            showInfo('Book edited successfull.');
            listBooks();
        }
    }
}