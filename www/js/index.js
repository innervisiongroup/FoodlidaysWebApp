var js_enabled = 0;

$(document).ready(function() 
{
    if(localStorage.getItem("connected") === null) window.open("login.html"); //si pas co redirection vers login
    
    //define Cat object
    var Cat = function(i,n){
        this.id = i;
        this.name = n;
    };
    var cats = [];
    
    //define Article object
    var Article = function(n,q,p,i,id) {
        this.name = n;
        this.quantity = q;
        this.price = p;
        this.image = i;
        this.id = id;
    };
    var articles = [];
    
    localStorage.cat = "";
    var cpt = 1;
    
    
    /*****************************************************************MENU CLICK*********************************************************************/
    
    $("#menu").click(function(event)
    {
        menu_launched = 1;
        $(document).off("click","#full_w tr");
        $(document).off("click","#basketlist tr");
        
        $("#container").html("");
        
        /**
        **  retrieve existing categories from server
        **/
        
        $.get( "http://foodlidays.dev.innervisiongroup.com/api/v1/category", 
        function(data) 
        {
            cats = [];
            for(var c = 0 ; c < data.length ; c++)
            {
                var cat = new Cat(data[c].id,data[c].name);
                cats .push(cat);
            }
        }
        ,"json").fail(function()
        {
            alert( "A network error occured, please check your internet connexion or try again later" );
        });
        
        
        /**
        **  fill list with cat
        **/
        

        $("#container").append("<form class=\"categories\"> Catégorie : <select class=\"sel\" id=\"categ\" name=\"cat\" size=\"1\"> <option values=\"0\" selected=\"selected\"> Toutes </otpion>");
        for (var d = 0 ; d < cats.length ; d ++)
        {
            $("#categ").append(" <option value=" + cats[d].id + " > " + cats[d].name +" </option> ");
        }
        $("#container").append("</select> </form> <hr class=\"sep\" />");
        
        if(localStorage.cat !== "")
        {
            $('#categ').val(localStorage.cat);
        }
        
        
        /** 
        **  retrieve food from server 
        **/
        
        $.get( "http://foodlidays.dev.innervisiongroup.com/api/v1/food/cat/all/" + localStorage.zip, 
        function(data) 
        {
            $( "#container" ).append("<table id=\"productlist\" >");
            
            for(var i = 0 ; i<data.length ; i++)
            {
                if((localStorage.cat === data[i].category_id) || (localStorage.cat === ""))
                {
                    $( "#productlist" ).append("<tr id="+data[i].id+" > <td> <img class=\"image_food\" src=\"http://foodlidays.dev.innervisiongroup.com/uploads/" +data[i].image + "\"></img> </td> <td class=\"to_get\">                      <div>" + data[i].name + "</div><div class='note'> " + data[i].note + " </div> </td>  <td> "  + data[i].price  + "€ </td> </tr>"); 
                }
            }
            
            $( "#container" ).append("</table>");
            
            
            /**
            **  event on click sur une rangée
            **/
            
            
            $(document).on("click", "#productlist tr", function(e)
            {                 
                var id = $(this).attr('id');
                
                for(var i = 0; i < data.length; i++)
                {
                    if(id == data[i].id)
                    {     
                        var tab = data[i];
                        tab.quantity = 0;  
                        var existing = 0;
                        
                        
                        if(typeof articles[0] != 'undefined')
                        {
                            for(var j = 0; j < articles.length; j++)
                            {
                                if(articles[j].id == tab.id)
                                {
                                    tab.quantity = articles[j].quantity;
                                    existing = articles[j];
                                }
                            }
                        }
                        
                        //dialog pour quantité
                         $("<div id='id"+tab.id+"'> "+tab.quantity+" </div>").dialog(
                         {
                            title : "Choisir quantité de " +  tab.name,
                            text: tab.quantity,
                            buttons: [
                            {
                            text: "-",
                            click: function() 
                                {
                                    tab.quantity = tab.quantity - 1;
                                    $('#id'+tab.id).text(tab.quantity);
                                }
                            },
                            {
                            text: "+",
                            click: function() 
                                {
                                    tab.quantity = tab.quantity + 1;
                                    $('#id'+tab.id).text(tab.quantity);
                                }
                            },                    
                            {
                            text: "Valider",
                            click: function()
                                {
                                    if(tab.quantity > 0 && existing === 0) {
                                    $( this ).dialog( "close" );
                                    
                                     var art = new Article(tab.name, tab.quantity , tab.price , tab.image , tab.id);
                                     articles.push(art);
                                     alert(tab.name + " ajouté au panier ! ");
                                    }
                                    
                                    else if (tab.quantity <= 0) {
                                        alert("La quantité doit être supérieure à 0");
                                    }
                                    
                                    else if(existing != 'undefined'){
                                         $( this ).dialog( "close" );
                                        existing.quantity = tab.quantity;
                                        alert(existing.name + " maintenant dans le panier ! ");
                                        
                                    }
                                    
                                   $(this).dialog('destroy').remove();
                                   
                                }}]
                        });
  
                    }
                }
                
            });
            
            
        }
        ,"json").fail(function()
        {
            alert( "A network error occured, please check your internet connexion or try again later" );
        });
        
        
        /**
        **  Au changement de catégories
        **/
        
        $( "#categ").change(function () 
        {   
            if((cpt % 2) === 0) 
            {
                cpt ++;
            }
            else
            {
                var str = "";

                $( "select option:selected" ).each(function()
                {
                  str += $( this ).text();
                });
                str = str.trim();

                if(str === "Toutes") localStorage.cat = "";
                else
                {
                    for(var f = 0 ; f < cats.length ; f++)
                    {
                        if(cats[f].name === str) 
                        {
                            localStorage.cat = cats[f].id;
                        }
                    }
                }

                $(document).off("click","#productlist tr");
                cpt ++;
                $("#menu").trigger("click");
            }
            
        }).change();
        
    });
 
    
    /**********************************************************PANIER CLICK***************************************************************/
    
    
    $("#panier").click(function(event)
    {
        //$(document).on("click", "#productlist tr", function(e)
        $(document).off("click","#productlist tr");
        $(document).off("click","#full_w tr");
        
        $("#container").html("");
        
        if(articles.length === 0) $("#container").html("<h2 class=\"any_command\" > Votre panier est vide </h2>");
        else 
        {
            $("#container").append("<div class='basketwrapper'> <table id='basketlist' class=\"basket_table\"> <tr> <th class='image_basket'> Produit </th> <th> Quantité </th> <th> Prix </th> <th> Sous-total </th>                  <tr>");
            for(var i = 0 ; i < articles.length ; i++)
            {
                  $("#basketlist").append("<tr id="+articles[i].id+" ><td> <img class=\"image_basket\" src=\"http://foodlidays.dev.innervisiongroup.com/uploads/"+ articles[i].image+"\"><br/> "+ articles[i].name +"</td> <td> "+            articles[i].quantity +"</td> <td> "+ articles[i].price +" €</td> <td> "+ (articles[i].price * articles[i].quantity).toFixed(2) +" €</td> </tr>");
            }
            $("#container").append("</table> </br></div>");
        
            var st =  0; //faire le total du panier
            for(k = 0 ; k < articles.length ; k++)
            {
                st = st + articles[k].price * articles[k].quantity;
            }
            var frais = 1.5;
            var total = parseFloat(st) + parseFloat(frais);
            
            $("#container").append(" <div class='resume'> Sous total : " + st.toFixed(2) + "€ </br> Frais de gestion : "+ frais.toFixed(2) + "€ </br> Total à payer : " + total.toFixed(2) + "€ <span id='reset'>  </span> </div> <div><input type=\"button\" id='toOrder' value=\"Commander\"></div>");
        }    
        
        /**
        **  Quand pousser sur bouton commande
        **/
        
        $('#toOrder').click(function () 
        {
       
                $("<div> Choisissez votre moyen de payement </div>").dialog({
                    title: "Méthode de payement",
                      buttons: [
                        {
                            text: "Cash",
                            click: function() 
                            {
                                $( this ).dialog( "close" );
                                ConstructOrder("cash");
                            }
                        },
                        {
                        text: "Card",
                        click: function() 
                        {
                            $( this ).dialog( "close");
                            ConstructOrder("card");
                            
                            $(this).dialog('destroy').remove();
                        }}]
                  });
            
        });
        
            $(document).on("click", "#basketlist tr", function(e)
            { 
                var id = $(this).attr('id');
                
                for(var x = 0; x < articles.length; x++)
                {
                 
                    if(id === articles[x].id)
                    {
                        var tab = articles[x];
                        var index = x;
                    }
                    
                }

                    //dialog pour quantité
                        $("<div id='id"+tab.id+"'> "+tab.quantity+" </div>").dialog(
                         {
                            title : "Choisir quantité de " +  tab.name,
                            text: tab.quantity,
                            buttons: [
                            {
                            text: "-",
                            click: function() 
                                {
                                    tab.quantity = tab.quantity - 1;
                                    $('#id'+tab.id).text(tab.quantity);
                                }
                            },
                            {
                            text: "+",
                            click: function() 
                                {
                                    tab.quantity = tab.quantity + 1;
                                    $('#id'+tab.id).text(tab.quantity);
                                }
                            }, 
                                
                            {
                            text: "Supprimer",
                            click: function()
                                {
                                    articles = articles.slice(x);
                                    $(this).dialog( "close" );
                                     $("#panier").trigger("click");
                                }
                            },
                            {
                            text: "Valider",
                            click: function()
                                {
                                    tab.quantity = tab.quantity;
                                    alert("Nombre d'articles modifié !");
                                    $(this).dialog( "close" );
                                    
                                    if(tab.quantity === 0)
                                    {
                                        alert("Article supprimé du panier !");
                                        articles = articles.slice(x);
                                    }
                                    
                                    $(this).dialog('destroy').remove();
                                    
                                    $("#panier").trigger("click");
                                    
                                        
                                }}]
                        });
  
                    }    
        );
        
                            
        $('#reset').click(function () 
        {
            //dialog pour quantité
            $("<div> Voulez-vous vraiment supprimer votre panier ? </div>").dialog(
             {
                title : "Suppression articles",
                buttons: [
                {
                text: "Supprimer",
                click: function() 
                    {
                        articles = [];
                        $(this).dialog( "close" );
                        $("#panier").trigger("click");
                    }
                },
                {
                text: "Annuler",
                click: function() 
                    {
                        $(this).dialog( "close" );
                        $("#panier").trigger("click");
                    }
                }]
             });
            
        });
                          
        
        function ConstructOrder(method)
        {
            //first, construct array with foods
            var foods = [];
            
            for(var g = 0 ; g < articles.length ; g ++)
            {
                var art = {};
                art.id = articles[g].id;
                art.quantity = articles[g].quantity;
                foods.push(art);
            }
            
            //then, final object order
            var order = {};
            order.type_room = localStorage.place_type;
            order.email = localStorage.user_email;
            order.room_number = localStorage.room_number;
            order.id_room = localStorage.id;
            order.city = localStorage.city;
            order.zip = localStorage.zip;
            order.country = localStorage.country;
            order.address = localStorage.street_address;
            order.id_user = localStorage.user_id;
            order.plats = foods;
            order.method_payement = method;
            order.language = "fr";
            if(localStorage.place_type === "place")
            {
                order.room = 0;
                order.floor = 0;
            }
            else
            {
                order.floor = localStorage.floor;
                order.room = localStorage.room;
            }
            
            console.log(JSON.stringify(order));
            MakeOrder(JSON.stringify(order));
        }
        
        
        
        function MakeOrder(order)
        {
            $.post(
                "http://foodlidays.dev.innervisiongroup.com/api/v1/order",
                { order : order },
                function(data, status)
                {
                    articles = [];
                   
                    alert("Vous aller être rediriger vers votre profil pour suivre votre commande");
                     $("#profil").trigger("click");
                },
                "json"
                ).fail(function() 
                {
                    alert( "A network error occured, please check your internet connexion or try again later" );
                });
        }
        
    });
    
    /************************************************************PROFIL CLICK*****************************************************************/
    
    
    $("#profil").click(function(event)
    {
        var orders_list;
        $(document).off("click","#productlist tr");
        $(document).off("click","#basket tr");
        
        $("#container").html("");
        
        $("#container").append("<div class=\"info_profil\"> Identifiant de chambre : " + localStorage.room_number + " </div>");
        $("#container").append("<div class=\"info_profil\"> Votre email : " + localStorage.user_email + " </div> </br>");
        $("#container").append("<div class=\"info_profil\"> Localisation de la chambre : </div>");
        $("#container").append("<div class=\"info_profil\">" + localStorage.street_address + " </div>" );
        $("#container").append("<div class=\"info_profil\">" + localStorage.zip + " " + localStorage.city + " </div>");
        $("#container").append("<div class=\"info_profil\">" + localStorage.floor + "e étage, chambre " + localStorage.room + "</div>");
        $("#container").append("<hr class=\"sep\" />");
        
        
        // get orders from email user
        $.get( "http://foodlidays.dev.innervisiongroup.com/api/v1/order/" + localStorage.user_email, 
        function( data ) 
        {
            orders_list = data;
            if(data.length >= 1)
            {
                $( "#container" ).append(" <span class='orders'> Vos commandes : </span> <br/> <div class='orderwrapper'>");
                $( ".orderwrapper" ).append("<table id=\"full_w\" > <tr> <th class='text_left'> Numéro </th> <th class='text_middle'> Passée le </th> <th class='text_right'> Statut </th> </tr>");
            
                for(var i = 0 ; i<data.length ; i++)
                {
                    $( "#full_w" ).append("<tr id=" + data[i].id + "> <td class='text_left'> " + data[i].id + " </td> <td class='text_middle'> " + data[i].created_at + " </td> <td class='text_right'> " + data[i].status + " </td>                             </tr> ");
                }
                $( "#container" ).append("</table>");
            }
            else
            {
                $("#container").append(" </div> <div class=\"orders\"> Aucunes commande en cours <br/>");
            }
        },
        "json").fail(function() 
        {
            alert( "A network error occured, please check your internet connexion or try again later" );
        });
        
        $("#container").append("</div></div> <input type=\"button\" id='logout' value=\"Déconnexion\" > </div>");
        
        
        //Résumé au click d'une commade 
        $(document).on("click", "#full_w tr", function(e)
        {    
             for(var i = 0 ; i<orders_list.length ; i++)
             {   
                 if(orders_list[i].id == $(this).attr('id') )
                 {
                     var toShow = "Résumé de la commande " + orders_list[i].id + "\n------------------------------- \n";
                      
                     for(var j = 0 ; j<orders_list[i].foods.length ; j++)
                     {
                        toShow = toShow + orders_list[i].foods[j].ordered_quantity + " x " + orders_list[i].foods[j].food_name + "\n";
                      }
                     toShow = toShow + "------------------------------- \n" + orders_list[i].total_price + "€,  by " + orders_list[i].payment_mode + "\nLe " + orders_list[i].created_at;
                     
                     alert(toShow);
                 }
             }
            
        });
        
        
        $("#logout").click(function(event)
        {
            localStorage.clear();
            window.open("login.html");
        });
        
    });
    
    $("#menu").trigger("click");
    
});